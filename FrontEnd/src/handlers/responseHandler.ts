import { ApiError, NotFoundError, ServerError } from "../exceptions";

/**
 * fetch Response를 공통으로 처리하는 핸들러
 *
 * - 200: JSON 파싱 후 반환
 * - 404: NotFoundError (null 허용 여부는 호출부에서 결정)
 * - 4xx: ApiError
 * - 5xx: ServerError
 */
export async function handleResponse<T>(
  res: Response,
  endpoint: string,
  allowNotFound = false,
): Promise<T | null> {
  if (res.ok) {
    return res.json() as Promise<T>;
  }

  // 에러 바디에서 detail 추출 시도
  const body = await res.json().catch(() => ({})) as { detail?: string };
  const detail = body.detail;

  if (res.status === 404) {
    if (allowNotFound) return null;
    throw new NotFoundError(endpoint, detail);
  }

  if (res.status >= 500) {
    throw new ServerError(endpoint, res.status, detail);
  }

  throw new ApiError(
    detail ?? `요청 처리 실패 (${res.status})`,
    res.status,
    endpoint,
  );
}

/**
 * 에러 객체를 사용자에게 표시할 메시지로 변환
 */
export function resolveErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error)    return error.message;
  return "알 수 없는 오류가 발생했습니다.";
}
