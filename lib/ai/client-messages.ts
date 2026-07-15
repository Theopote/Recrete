export interface AIErrorPayload {
  error?: string;
  code?: string;
  message?: string;
  retryable?: boolean;
}

export function parseAIErrorResponse(
  data: unknown,
  fallback = "请求失败，请稍后重试。"
): { message: string; retryable: boolean } {
  if (data && typeof data === "object") {
    const payload = data as AIErrorPayload;
    if (typeof payload.message === "string" && payload.message.length > 0) {
      return {
        message: payload.message,
        retryable: Boolean(payload.retryable),
      };
    }
    if (typeof payload.error === "string" && payload.error.length > 0) {
      return { message: payload.error, retryable: Boolean(payload.retryable) };
    }
  }
  return { message: fallback, retryable: true };
}
