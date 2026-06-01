import { BASE_URL, ENDPOINTS } from "../constants";
import { handleResponse } from "../handlers";
import type { CropRegionsResponse } from "./types";

/**
 * GET /crop-regions/{crop}
 * Gemini AI 기반 작물별 최적 재배 지역 및 농업 데이터 조회
 */
export async function getCropRegions(crop: string): Promise<CropRegionsResponse> {
  const endpoint = ENDPOINTS.CROP_REGIONS(crop);
  const res = await fetch(`${BASE_URL}${endpoint}`);
  return handleResponse<CropRegionsResponse>(res, endpoint) as Promise<CropRegionsResponse>;
}
