import { BASE_URL, ENDPOINTS } from "../constants";
import { handleResponse } from "../handlers";
import type { PredictRequest, PredictResponse } from "./types";

/**
 * POST /predict
 * 토양·기후 데이터를 기반으로 최적 작물을 ML 모델로 추천
 */
export async function predictCrop(data: PredictRequest): Promise<PredictResponse> {
  const endpoint = ENDPOINTS.PREDICT;
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(data),
  });
  return handleResponse<PredictResponse>(res, endpoint) as Promise<PredictResponse>;
}
