import { BASE_URL, ENDPOINTS } from "../constants";
import { handleResponse } from "../handlers";
import type { FertilizerResponse } from "./types";

/**
 * GET /fertilizer/{crop}
 * 국립농업과학원 비료 표준사용량 처방 정보 조회
 * 국내 표준이 없는 작물(열대 작물 등)은 null 반환
 */
export async function getFertilizer(crop: string): Promise<FertilizerResponse | null> {
  const endpoint = ENDPOINTS.FERTILIZER(crop);
  const res = await fetch(`${BASE_URL}${endpoint}`);
  return handleResponse<FertilizerResponse>(res, endpoint, /* allowNotFound */ true);
}
