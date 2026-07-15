/**
 * User-facing AI error types — no stack traces in API responses.
 */

export type AIErrorCode =
  | "AI_UNAVAILABLE"
  | "AI_RATE_LIMIT"
  | "AI_TIMEOUT"
  | "AI_QUOTA_EXCEEDED"
  | "AI_INVALID_RESPONSE"
  | "AI_CONFIG_ERROR";

export class AIServiceError extends Error {
  readonly code: AIErrorCode;
  readonly retryable: boolean;
  readonly messageZh: string;
  readonly statusCode: number;

  constructor(opts: {
    code: AIErrorCode;
    messageZh: string;
    retryable?: boolean;
    statusCode?: number;
    cause?: unknown;
  }) {
    super(opts.messageZh);
    this.name = "AIServiceError";
    this.code = opts.code;
    this.messageZh = opts.messageZh;
    this.retryable = opts.retryable ?? false;
    this.statusCode = opts.statusCode ?? (opts.code === "AI_QUOTA_EXCEEDED" ? 429 : 503);
    if (opts.cause) this.cause = opts.cause;
  }
}

const MESSAGES: Record<AIErrorCode, string> = {
  AI_UNAVAILABLE: "AI 服务暂时不可用，请稍后重试。",
  AI_RATE_LIMIT: "AI 服务请求过于频繁，请稍后再试。",
  AI_TIMEOUT: "AI 响应超时，请稍后重试。",
  AI_QUOTA_EXCEEDED: "本事务所今日 AI 调用已达上限，请明日再试或联系管理员。",
  AI_INVALID_RESPONSE: "AI 返回格式异常，请重试。",
  AI_CONFIG_ERROR: "AI 服务未正确配置，请联系管理员。",
};

export function normalizeAIError(error: unknown): AIServiceError {
  if (error instanceof AIServiceError) return error;

  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();

  if (
    lower.includes("rate limit") ||
    lower.includes("429") ||
    lower.includes("too many requests")
  ) {
    return new AIServiceError({
      code: "AI_RATE_LIMIT",
      messageZh: MESSAGES.AI_RATE_LIMIT,
      retryable: true,
      cause: error,
    });
  }

  if (lower.includes("quota") || lower.includes("limit exceeded")) {
    return new AIServiceError({
      code: "AI_QUOTA_EXCEEDED",
      messageZh: MESSAGES.AI_QUOTA_EXCEEDED,
      retryable: false,
      statusCode: 429,
      cause: error,
    });
  }

  if (
    lower.includes("timeout") ||
    lower.includes("timed out") ||
    lower.includes("abort")
  ) {
    return new AIServiceError({
      code: "AI_TIMEOUT",
      messageZh: MESSAGES.AI_TIMEOUT,
      retryable: true,
      cause: error,
    });
  }

  if (
    lower.includes("api key") ||
    lower.includes("authentication") ||
    lower.includes("401") ||
    lower.includes("invalid_api_key")
  ) {
    return new AIServiceError({
      code: "AI_CONFIG_ERROR",
      messageZh: MESSAGES.AI_CONFIG_ERROR,
      retryable: false,
      statusCode: 503,
      cause: error,
    });
  }

  if (lower.includes("json") || lower.includes("parse")) {
    return new AIServiceError({
      code: "AI_INVALID_RESPONSE",
      messageZh: MESSAGES.AI_INVALID_RESPONSE,
      retryable: true,
      cause: error,
    });
  }

  return new AIServiceError({
    code: "AI_UNAVAILABLE",
    messageZh: MESSAGES.AI_UNAVAILABLE,
    retryable: true,
    cause: error,
  });
}

export function aiErrorToJson(error: unknown): {
  error: string;
  code: AIErrorCode;
  message: string;
  retryable: boolean;
} {
  const normalized = normalizeAIError(error);
  return {
    error: normalized.code,
    code: normalized.code,
    message: normalized.messageZh,
    retryable: normalized.retryable,
  };
}
