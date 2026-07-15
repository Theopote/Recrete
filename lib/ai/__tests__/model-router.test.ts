import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getAIServiceMode } from "@/lib/ai/model-router";

describe("getAIServiceMode", () => {
  const originalKey = process.env.OPENAI_API_KEY;
  const originalService = process.env.AI_SERVICE;

  afterEach(() => {
    process.env.OPENAI_API_KEY = originalKey;
    process.env.AI_SERVICE = originalService;
  });

  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.AI_SERVICE;
  });

  it("defaults to mock without API key", () => {
    expect(getAIServiceMode()).toBe("mock");
  });

  it("auto-enables openai when key is set", () => {
    process.env.OPENAI_API_KEY = "sk-test";
    expect(getAIServiceMode()).toBe("openai");
  });

  it("respects explicit mock override", () => {
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.AI_SERVICE = "mock";
    expect(getAIServiceMode()).toBe("mock");
  });
});
