/**
 * 백엔드 API 호출 실패 시 던지는 커스텀 에러
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly endpoint: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * 404: 데이터 없음 (열대 작물 비료 표준 등)
 */
export class NotFoundError extends ApiError {
  constructor(endpoint: string, detail?: string) {
    super(detail ?? `데이터를 찾을 수 없습니다.`, 404, endpoint);
    this.name = "NotFoundError";
  }
}

/**
 * 서버 내부 오류 (5xx)
 */
export class ServerError extends ApiError {
  constructor(endpoint: string, status: number, detail?: string) {
    super(detail ?? `서버 오류가 발생했습니다. (${status})`, status, endpoint);
    this.name = "ServerError";
  }
}
