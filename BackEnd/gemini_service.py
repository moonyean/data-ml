from google import genai
import json
import re
import time
import os
from dotenv import load_dotenv

load_dotenv()

# ── Gemini 초기화 ─────────────────────────────────────────────
GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]
client = genai.Client(api_key=GEMINI_API_KEY)

# 할당량 소진 시 순서대로 폴백
MODELS = [
    "gemini-2.0-flash-lite",
    "gemini-flash-latest",
    "gemini-flash-lite-latest",
]

# ── 작물 한글명 매핑 ─────────────────────────────────────────
CROP_KO: dict[str, str] = {
    "rice":        "벼(쌀)",
    "maize":       "옥수수",
    "chickpea":    "병아리콩",
    "kidneybeans": "강낭콩",
    "pigeonpeas":  "비둘기콩",
    "mothbeans":   "나방콩",
    "mungbean":    "녹두",
    "blackgram":   "검정콩",
    "lentil":      "렌틸콩",
    "pomegranate": "석류",
    "banana":      "바나나",
    "mango":       "망고",
    "grapes":      "포도",
    "watermelon":  "수박",
    "muskmelon":   "참외/멜론",
    "apple":       "사과",
    "orange":      "오렌지",
    "papaya":      "파파야",
    "coconut":     "코코넛",
    "cotton":      "목화",
    "jute":        "황마",
    "coffee":      "커피",
}

# ── 정적 폴백 데이터 (Gemini 전부 실패 시 사용) ───────────────
# 대표 4개 작물만 정의, 나머지는 공통 템플릿으로 채움
_STATIC: dict[str, dict] = {
    "rice": {
        "crop": "rice", "crop_ko": "벼(쌀)",
        "best_regions": [
            {"region": "전라남도 해남군", "country": "대한민국",
             "reason": "남해안 온화한 기후와 비옥한 충적 평야로 쌀 품질이 우수하며 전국 최대 쌀 생산지 중 하나.",
             "climate": "온대 해양성", "soil_type": "충적 점토질",
             "growing_season": "5~10월", "avg_temperature_c": 14, "avg_rainfall_mm": 1300,
             "major_production": "전국 쌀 생산량 상위권"},
            {"region": "충청남도 당진시", "country": "대한민국",
             "reason": "서해안의 넓은 간척 평야와 풍부한 일조량으로 고품질 쌀 생산.",
             "climate": "온대 대륙성", "soil_type": "충적 양토",
             "growing_season": "5~10월", "avg_temperature_c": 12, "avg_rainfall_mm": 1100,
             "major_production": "충남 최대 쌀 주산지"},
            {"region": "경기도 이천시", "country": "대한민국",
             "reason": "임금님 진상미로 유명한 이천쌀 산지, 내륙 분지 기후와 청정 수자원이 조화롭습니다.",
             "climate": "온대 대륙성", "soil_type": "사양토~양토",
             "growing_season": "5~10월", "avg_temperature_c": 12, "avg_rainfall_mm": 1200,
             "major_production": "프리미엄 쌀 브랜드 대표 산지"},
        ],
        "ideal_conditions": {
            "temperature_range": "20~35°C", "rainfall_range": "150~300mm/월",
            "ph_range": "5.5~7.0", "humidity_range": "70~90%",
        },
        "farming_tips": [
            "모내기 전 15~20일간 육묘 과정을 거쳐 건강한 모종을 준비하세요.",
            "논물 관리는 활착기 5cm → 분얼기 1~3cm → 수잉기 5~7cm로 조절하세요.",
            "이삭이 패기 전 30일이 생육 황금기, 질소 추비를 주의하세요.",
        ],
        "harvest_info": "출수 후 40~45일, 이삭이 90% 이상 황색으로 변했을 때 수확 (9월 말~10월 초)",
        "source": "static_fallback",
    },
    "coffee": {
        "crop": "coffee", "crop_ko": "커피",
        "best_regions": [
            {"region": "제주특별자치도 서귀포시", "country": "대한민국",
             "reason": "한국에서 유일하게 상업적 커피 재배가 가능한 아열대 기후 지역으로 온난한 겨울이 특징.",
             "climate": "아열대 해양성", "soil_type": "화산성 현무암 토양",
             "growing_season": "연중 (실내·시설 재배)", "avg_temperature_c": 16, "avg_rainfall_mm": 1800,
             "major_production": "국내 유일 상업 커피 재배지"},
            {"region": "전라남도 고흥군", "country": "대한민국",
             "reason": "남해안 온화한 기후로 시설 하우스 재배 시 커피 생산 가능.",
             "climate": "온대 해양성", "soil_type": "황토 양토",
             "growing_season": "시설 재배 연중", "avg_temperature_c": 14, "avg_rainfall_mm": 1400,
             "major_production": "시험·체험 재배 단계"},
            {"region": "경상남도 거제시", "country": "대한민국",
             "reason": "남해안 섬 지역 특유의 온화한 해양성 기후로 커피 시설 재배 적합.",
             "climate": "온대 해양성", "soil_type": "사양토",
             "growing_season": "시설 재배 연중", "avg_temperature_c": 15, "avg_rainfall_mm": 1500,
             "major_production": "소규모 시설 재배"},
        ],
        "ideal_conditions": {
            "temperature_range": "15~24°C", "rainfall_range": "1200~2000mm/년",
            "ph_range": "6.0~6.5", "humidity_range": "70~85%",
        },
        "farming_tips": [
            "국내 노지 재배는 제주 외 불가하므로 시설(온실) 재배를 권장합니다.",
            "파치먼트 커피는 수분 함량 11% 이하로 건조 후 보관하세요.",
            "병충해 예방을 위해 통풍을 충분히 확보하고 정기적으로 방제하세요.",
        ],
        "harvest_info": "체리가 완전히 붉게 익었을 때 선택 수확, 국내 기준 11월~2월",
        "source": "static_fallback",
    },
}

# 나머지 작물용 공통 정적 템플릿 생성기
def _make_static(crop_en: str) -> dict:
    crop_ko = CROP_KO.get(crop_en, crop_en)
    return {
        "crop": crop_en,
        "crop_ko": crop_ko,
        "best_regions": [
            {"region": "전라남도 일원", "country": "대한민국",
             "reason": f"{crop_ko}은(는) 온난한 남부 기후와 비옥한 토양에서 잘 자라며 전남이 주요 산지입니다.",
             "climate": "온대 해양성", "soil_type": "충적 양토",
             "growing_season": "4~10월", "avg_temperature_c": 14, "avg_rainfall_mm": 1300,
             "major_production": "전국 주요 생산 지역"},
            {"region": "경상남도 일원", "country": "대한민국",
             "reason": "남해안의 온화한 기후와 풍부한 일조량이 재배에 유리합니다.",
             "climate": "온대 해양성", "soil_type": "사양토~양토",
             "growing_season": "4~10월", "avg_temperature_c": 14, "avg_rainfall_mm": 1400,
             "major_production": "경남 주요 생산지"},
        ],
        "ideal_conditions": {
            "temperature_range": "15~28°C",
            "rainfall_range": "100~200mm/월",
            "ph_range": "5.5~7.5",
            "humidity_range": "60~85%",
        },
        "farming_tips": [
            f"{crop_ko} 재배 시 토양의 배수 상태를 주기적으로 확인하세요.",
            "파종 전 토양 pH를 측정하고 적정 범위로 조정하세요.",
            "병해충 예방을 위해 작기별 돌려짓기(윤작)를 권장합니다.",
        ],
        "harvest_info": "성숙기 징후(잎 황변, 열매 색 변화 등)를 확인 후 수확",
        "source": "static_fallback",
    }


# ── 메모리 캐시 ───────────────────────────────────────────────
_cache: dict = {}


def _build_prompt(crop_en: str, crop_ko: str) -> str:
    return f"""
당신은 대한민국 농업 전문가입니다.
작물 "{crop_ko}({crop_en})"을 대한민국 내에서 재배하기 좋은 지역과 관련 농업 데이터를 JSON으로만 반환하세요.
JSON 외 설명, 마크다운, 코드블록 기호는 절대 포함하지 마세요.

반환 형식:
{{
  "crop": "{crop_en}",
  "crop_ko": "{crop_ko}",
  "best_regions": [
    {{
      "region": "대한민국 내 지역명 (예: 전라남도 해남군, 경상북도 안동시)",
      "country": "대한민국",
      "reason": "이 지역이 재배에 적합한 이유 2~3문장 (기후, 토양, 지형 등 한국 실정에 맞게)",
      "climate": "해당 지역의 기후 특성",
      "soil_type": "적합 토양 유형",
      "growing_season": "주요 재배 시기 (월 기준)",
      "avg_temperature_c": 연평균기온숫자,
      "avg_rainfall_mm": 연평균강수량숫자,
      "major_production": "해당 지역의 생산량 또는 전국 비중 정보"
    }}
  ],
  "ideal_conditions": {{
    "temperature_range": "적정 기온 범위 (예: 20~30°C)",
    "rainfall_range": "적정 강수량 범위 (예: 100~200mm)",
    "ph_range": "적정 토양 pH (예: 6.0~7.0)",
    "humidity_range": "적정 습도 (예: 60~80%)"
  }},
  "farming_tips": [
    "대한민국 재배 환경에 맞는 팁 1",
    "대한민국 재배 환경에 맞는 팁 2",
    "대한민국 재배 환경에 맞는 팁 3"
  ],
  "harvest_info": "대한민국 기준 수확 시기 및 방법 설명"
}}

best_regions는 반드시 대한민국 내 지역(도·시·군 단위)만 3~5개 포함하세요. 해외 지역은 절대 포함하지 마세요.
avg_temperature_c와 avg_rainfall_mm는 반드시 숫자(정수 또는 실수)로만 작성하세요.
"""


def _parse_json(text: str) -> dict:
    text = re.sub(r"^```(?:json)?\s*", "", text.strip(), flags=re.MULTILINE)
    text = re.sub(r"\s*```\s*$", "", text.strip(), flags=re.MULTILINE)
    text = text.strip()
    start = text.find("{")
    end   = text.rfind("}") + 1
    if start == -1 or end == 0:
        raise ValueError("응답에서 JSON 객체를 찾을 수 없습니다.")
    return json.loads(text[start:end])


def _is_quota_error(err: Exception) -> bool:
    s = str(err)
    return "429" in s or "RESOURCE_EXHAUSTED" in s


def _is_daily_limit(err: Exception) -> bool:
    return "PerDay" in str(err) or "limit: 0" in str(err)


def fetch_crop_regions(crop_en: str) -> dict:
    """
    작물명(영문)을 받아 재배 최적 지역 + 농업 데이터를 반환.

    우선순위:
      1. 메모리 캐시 (즉시 반환)
      2. Gemini API (모델 폴백 체인)
      3. 정적 폴백 데이터 (일일 할당량 소진 시)
    """
    crop_en = crop_en.lower().strip()

    # 1. 캐시 히트
    if crop_en in _cache:
        return _cache[crop_en]

    crop_ko = CROP_KO.get(crop_en, crop_en)
    prompt  = _build_prompt(crop_en, crop_ko)

    # 2. Gemini 폴백 체인
    for model_name in MODELS:
        for attempt in range(2):  # 모델당 최대 2회 (분당 한도 재시도용)
            try:
                resp   = client.models.generate_content(model=model_name, contents=prompt)
                result = _parse_json(resp.text)
                result["source"] = "gemini"
                _cache[crop_en] = result
                return result

            except Exception as e:
                if _is_daily_limit(e):
                    break           # 이 모델은 일일 한도 소진 → 다음 모델로
                if _is_quota_error(e) and attempt == 0:
                    time.sleep(65)  # 분당 한도 → 1분 대기 후 재시도
                    continue
                raise               # 그 외 에러는 즉시 전파

    # 3. 정적 폴백 (모든 모델 일일 한도 소진)
    result = _STATIC.get(crop_en) or _make_static(crop_en)
    _cache[crop_en] = result
    return result
