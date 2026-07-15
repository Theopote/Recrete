import { describe, it, expect } from "vitest";
import {
  AIServiceError,
  normalizeAIError,
  aiErrorToJson,
} from "@/lib/ai/errors";

describe("normalizeAIError", () => {
  it("passes through AIServiceError", () => {
    const original = new AIServiceError({
      code: "AI_QUOTA_EXCEEDED",
      messageZh: "已达上限",
    });
    expect(normalizeAIError(original)).toBe(original);
  });

  it("maps rate limit errors", () => {
    const err = normalizeAIError(new Error("429 rate limit exceeded"));
    expect(err.code).toBe("AI_RATE_LIMIT");
    expect(err.retryable).toBe(true);
  });

  it("maps timeout errors", () => {
    const err = normalizeAIError(new Error("Request timed out"));
    expect(err.code).toBe("AI_TIMEOUT");
    expect(err.retryable).toBe(true);
  });

  it("maps API key errors", () => {
    const err = normalizeAIError(new Error("401 invalid_api_key"));
    expect(err.code).toBe("AI_CONFIG_ERROR");
    expect(err.retryable).toBe(false);
  });

  it("serializes to user-safe JSON", () => {
    const json = aiErrorToJson(new Error("OpenAI API error: 503 service unavailable"));
    expect(json.message).toBeTruthy();
    expect(json.code).toBe("AI_UNAVAILABLE");
    expect(json).not.toHaveProperty("stack");
  });
});
