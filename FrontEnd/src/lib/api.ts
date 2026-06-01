const BASE_URL = "http://localhost:8000";

// ── 요청 타입 ────────────────────────────────────────────────
export interface PredictRequest {
  ph: number;
  rainfall: number;
  N: number;
  K?: number;
}

// ── 응답 타입: /predict ───────────────────────────────────────
export interface CropResult {
  crop: string;
  confidence: number;
}

export interface PredictResponse {
  recommended_crop: string;
  confidence: number;
  top3: CropResult[];
}

// ── 응답 타입: /fertilizer/{crop} ────────────────────────────
export interface FertilizerDose {
  nitrogen: number;
  phosphorus: number;
  potassium: number;
}

export interface FertilizerResponse {
  crop_en: string;
  crop_kr: string;
  fstd_crop_code: string;
  pre_fertilizer: FertilizerDose;
  post_fertilizer: FertilizerDose;
  note?: string;
}

// ── 응답 타입: /crop-regions/{crop} ─────────────────────────
export interface Region {
  region: string;
  country: string;
  reason: string;
  climate: string;
  soil_type: string;
  growing_season: string;
  avg_temperature_c: number;
  avg_rainfall_mm: number;
  major_production: string;
}

export interface CropRegionsResponse {
  crop: string;
  crop_ko: string;
  best_regions: Region[];
  ideal_conditions: {
    temperature_range: string;
    rainfall_range: string;
    ph_range: string;
    humidity_range: string;
  };
  farming_tips: string[];
  harvest_info: string;
  source: string;
}

// ── API 함수 ──────────────────────────────────────────────────
export async function predictCrop(data: PredictRequest): Promise<PredictResponse> {
  const res = await fetch(`${BASE_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `예측 API 오류 (${res.status})`);
  }
  return res.json();
}

export async function getCropRegions(crop: string): Promise<CropRegionsResponse> {
  const res = await fetch(`${BASE_URL}/crop-regions/${crop}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `지역 정보 API 오류 (${res.status})`);
  }
  return res.json();
}

/** 국내 비료 표준이 없는 작물(열대 작물 등)은 null 반환 */
export async function getFertilizer(crop: string): Promise<FertilizerResponse | null> {
  const res = await fetch(`${BASE_URL}/fertilizer/${crop}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `비료 API 오류 (${res.status})`);
  }
  return res.json();
}
