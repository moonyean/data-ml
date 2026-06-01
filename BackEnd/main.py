from fastapi import FastAPI, HTTPException, Response, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import joblib
import numpy as np
import os
import httpx
import xml.etree.ElementTree as ET
from dotenv import load_dotenv
from gemini_service import fetch_crop_regions

load_dotenv()

# ── 비료 API 설정 ─────────────────────────────────────────────
FRTLZR_API_KEY = os.getenv("DATA_ON_API", "")
FRTLZR_BASE_URL = "https://apis.data.go.kr/1390802/SoilEnviron/FrtlzrStdUse/getSoilFrtlzrQyList"

# ML 모델 영문 작물명 → 비료표준 작물코드 매핑
# 코드표 기준 가장 일반적인 재배조건으로 선택
CROP_CODE_MAP: dict[str, str] = {
    "rice":        "00001",  # 벼
    "maize":       "01021",  # 옥수수(보통옥수수)
    "apple":       "09005",  # 사과(비옥지-20년이상) → 성목 대표값
    "grapes":      "09024",  # 포도(비옥지-11년이상)
    "watermelon":  "04016",  # 수박(노지재배)
    "muskmelon":   "04013",  # 참외(노지재배) — 멜론 유사작물
    "orange":      "09052",  # 감귤(화산회토(온주),18년이상)
    "kidneybeans": "01018",  # 콩(기경지) — 강낭콩 유사
    "lentil":      "01018",  # 콩(기경지) — 렌틸 유사
    "mungbean":    "01018",  # 콩(기경지) — 녹두 유사
    "blackgram":   "01018",  # 콩(기경지) — 검은콩 유사
    "motherbeans": "01018",  # 콩(기경지) — 유사콩류
    "pigeonpeas":  "01018",  # 콩(기경지) — 유사콩류
    "chickpea":    "01018",  # 콩(기경지) — 병아리콩 유사
    "cotton":      None,     # 국내 비료표준 없음
    "jute":        None,     # 국내 비료표준 없음
    "coffee":      None,     # 국내 비료표준 없음
    "banana":      None,     # 국내 비료표준 없음
    "mango":       None,     # 국내 비료표준 없음
    "papaya":      None,     # 국내 비료표준 없음
    "pomegranate": None,     # 국내 비료표준 없음
    "coconut":     None,     # 국내 비료표준 없음
}

# ── 앱 초기화 ────────────────────────────────────────────────
app = FastAPI(
    title="CropSmart API",
    description="토양·기후 조건을 입력받아 최적 작물을 추천하는 API",
    version="1.0.0",
)

# CORS (프론트엔드 어디서든 호출 가능하게)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── 모델 로드 ────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

model = joblib.load(os.path.join(BASE_DIR, "crop_model.pkl"))
scaler = joblib.load(os.path.join(BASE_DIR, "scaler.pkl"))
le     = joblib.load(os.path.join(BASE_DIR, "label_encoder.pkl"))

# 프론트에서 입력받지 않는 특성의 기본값 (데이터셋 중앙값)
DEFAULTS = {
    "P":           51.0,
    "K":           32.0,
    "temperature": 25.60,
    "humidity":    80.47,
}

# 특성 입력 순서 (모델 학습 시와 동일하게 유지)
FEATURE_ORDER = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]


# ── 요청/응답 스키마 ─────────────────────────────────────────
class PredictRequest(BaseModel):
    # 프론트엔드에서 받는 3개 필수 입력
    ph:       float = Field(..., ge=3.5, le=10.0, description="토양 산도 (pH)", example=6.5)
    rainfall: float = Field(..., ge=0.0, le=500.0, description="연간 강수량 (mm)", example=120.0)
    N:        float = Field(..., ge=0.0, le=140.0, description="토양 질소량", example=50.0)

    # 추후 확장용 선택 입력 (미입력 시 데이터셋 중앙값 사용)
    P:           Optional[float] = Field(None, ge=0.0,  le=145.0, description="인산량")
    K:           Optional[float] = Field(None, ge=0.0,  le=205.0, description="칼륨량")
    temperature: Optional[float] = Field(None, ge=0.0,  le=50.0,  description="기온 (°C)")
    humidity:    Optional[float] = Field(None, ge=0.0,  le=100.0, description="습도 (%)")

    class Config:
        json_schema_extra = {
            "example": {
                "ph": 6.5,
                "rainfall": 120.0,
                "N": 50,
            }
        }


class CropResult(BaseModel):
    crop:       str
    confidence: float   # 0.0 ~ 1.0


class PredictResponse(BaseModel):
    recommended_crop: str           # 1순위 추천 작물
    confidence:       float         # 1순위 신뢰도
    top3:             list[CropResult]  # 상위 3개 후보


class FertilizerDose(BaseModel):
    nitrogen:   float = Field(..., description="질소 처방량 (kg/10a)")
    phosphorus: float = Field(..., description="인산 처방량 (kg/10a)")
    potassium:  float = Field(..., description="칼리 처방량 (kg/10a)")


class FertilizerResponse(BaseModel):
    crop_en:         str               # 영문 작물명 (ML 모델 출력)
    crop_kr:         str               # 한글 작물명 (비료표준)
    fstd_crop_code:  str               # 비료표준 작물코드
    pre_fertilizer:  FertilizerDose    # 밑거름
    post_fertilizer: FertilizerDose    # 웃거름
    note:            Optional[str] = None  # 매핑 주의사항


# ── 엔드포인트 ───────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "service": "CropSmart API v1.0"}


@app.get("/crops", tags=["Info"])
def get_crops():
    """추천 가능한 작물 목록 반환"""
    return {"crops": sorted(le.classes_.tolist())}


@app.get("/crop-regions/{crop}", tags=["Gemini"])
def crop_regions(crop: str):
    """
    작물명을 입력하면 Gemini AI가 재배 최적 지역과 농업 데이터를 반환합니다.

    - 동일 작물 반복 요청 시 캐시에서 즉시 반환
    - `/crops` 엔드포인트에서 지원 작물 목록 확인 가능
    """
    crop = crop.lower().strip()
    if crop not in le.classes_:
        raise HTTPException(
            status_code=404,
            detail=f"'{crop}'은 지원하지 않는 작물입니다. GET /crops 에서 목록을 확인하세요.",
        )
    try:
        return fetch_crop_regions(crop)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API 오류: {str(e)}")


@app.get("/fertilizer/{crop}", response_model=FertilizerResponse, tags=["Fertilizer"])
def get_fertilizer(crop: str):
    """
    작물명(영문)을 입력하면 국립농업과학원 비료 표준사용량 처방 정보를 반환합니다.

    - `/crops` 엔드포인트에서 지원 작물 목록 확인 가능
    - 밑거름(pre)·웃거름(post) 각각 질소(N)·인산(P)·칼리(K) 처방량 (단위: kg/10a)
    - 국내 비료표준이 없는 열대 작물(banana, coffee 등)은 404 반환
    """
    crop = crop.lower().strip()
    if crop not in le.classes_:
        raise HTTPException(
            status_code=404,
            detail=f"'{crop}'은 지원하지 않는 작물입니다. GET /crops 에서 목록을 확인하세요.",
        )

    if crop not in CROP_CODE_MAP or CROP_CODE_MAP[crop] is None:
        raise HTTPException(
            status_code=404,
            detail=f"'{crop}'은 국내 비료 표준사용량 데이터가 없는 작물입니다. (열대성 작물 등)",
        )

    fstd_code = CROP_CODE_MAP[crop]

    try:
        # serviceKey는 .env에 이미 URL 인코딩된 상태로 저장됨
        # httpx params= 사용 시 이중 인코딩 발생하므로 URL 직접 조립
        url = f"{FRTLZR_BASE_URL}?serviceKey={FRTLZR_API_KEY}&fstd_Crop_Code={fstd_code}"
        resp = httpx.get(url, timeout=10.0)
        resp.raise_for_status()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"비료 API 호출 실패: {str(e)}")

    try:
        root = ET.fromstring(resp.text)
        result_code = root.findtext(".//result_Code", "")
        if result_code != "200":
            msg = root.findtext(".//result_Msg", "알 수 없는 오류")
            raise HTTPException(status_code=502, detail=f"비료 API 오류 ({result_code}): {msg}")

        item = root.find(".//item")
        if item is None:
            raise HTTPException(status_code=404, detail="비료 처방 데이터가 없습니다.")

        def val(tag: str) -> float:
            return float(item.findtext(tag, "0") or 0)

        crop_kr   = item.findtext("fstd_Crop_Nm", "")
        crop_code = item.findtext("fstd_Crop_Code", fstd_code)
    except ET.ParseError as e:
        raise HTTPException(status_code=502, detail=f"API 응답 파싱 실패: {str(e)}")

    # 콩류 계열은 여러 작물이 같은 코드를 쓰므로 안내 주석 추가
    bean_crops = {"kidneybeans", "lentil", "mungbean", "blackgram", "motherbeans", "pigeonpeas", "chickpea"}
    note = f"'{crop}'의 한국 표준은 없어 콩(기경지) 기준으로 제공됩니다." if crop in bean_crops else None

    return FertilizerResponse(
        crop_en=crop,
        crop_kr=crop_kr,
        fstd_crop_code=crop_code,
        pre_fertilizer=FertilizerDose(
            nitrogen=val("pre_Fert_N"),
            phosphorus=val("pre_Fert_P"),
            potassium=val("pre_Fert_K"),
        ),
        post_fertilizer=FertilizerDose(
            nitrogen=val("post_Fert_N"),
            phosphorus=val("post_Fert_P"),
            potassium=val("post_Fert_K"),
        ),
        note=note,
    )


@app.post("/predict", response_model=PredictResponse, tags=["Predict"])
def predict(req: PredictRequest, response: Response):
    """
    토양·기후 조건을 입력받아 최적 작물을 추천합니다.

    - **ph**: 토양 산도 (필수)
    - **rainfall**: 연간 강수량 mm (필수)
    - **N**: 토양 질소량 (필수)
    - 나머지 P, K, temperature, humidity 는 선택 (미입력 시 데이터셋 중앙값 사용)

    응답 헤더:
    - `X-Recommended-Crop`: 1순위 추천 작물명
    - `X-Confidence`: 1순위 신뢰도 (0.0 ~ 1.0)
    """
    # 선택 입력 기본값 채우기
    P           = req.P           if req.P           is not None else DEFAULTS["P"]
    K           = req.K           if req.K           is not None else DEFAULTS["K"]
    temperature = req.temperature if req.temperature is not None else DEFAULTS["temperature"]
    humidity    = req.humidity    if req.humidity    is not None else DEFAULTS["humidity"]

    # 모델 입력 벡터 구성 (학습 순서 그대로)
    feature_values = [req.N, P, K, temperature, humidity, req.ph, req.rainfall]
    X = np.array([feature_values])

    # 예측 (Random Forest → 스케일링 불필요)
    try:
        proba   = model.predict_proba(X)[0]          # shape: (22,)
        top_idx = np.argsort(proba)[::-1][:3]        # 상위 3개 인덱스
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"모델 예측 오류: {str(e)}")

    top3 = [
        CropResult(
            crop       = le.classes_[i],
            confidence = round(float(proba[i]), 4),
        )
        for i in top_idx
    ]

    # 추천 작물을 응답 헤더에도 포함
    response.headers["X-Recommended-Crop"] = top3[0].crop
    response.headers["X-Confidence"]       = str(top3[0].confidence)

    return PredictResponse(
        recommended_crop = top3[0].crop,
        confidence       = top3[0].confidence,
        top3             = top3,
    )
