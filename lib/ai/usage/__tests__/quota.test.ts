import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { AIServiceError } from "@/lib/ai/errors";
import {
  clearMemoryUsage,
  recordUsage,
  getUsageSummary,
} from "@/lib/ai/usage";
import { assertAIQuota } from "@/lib/ai/usage/quota";

describe("AI usage quota", () => {
  const orgId = "org-test-quota";

  beforeEach(() => {
    clearMemoryUsage();
    process.env.AI_DAILY_ORG_LIMIT = "3";
    process.env.AI_MONTHLY_ORG_LIMIT = "10";
  });

  afterEach(() => {
    delete process.env.AI_DAILY_ORG_LIMIT;
    delete process.env.AI_MONTHLY_ORG_LIMIT;
    clearMemoryUsage();
  });

  async function recordN(count: number) {
    for (let i = 0; i < count; i++) {
      await recordUsage({
        organizationId: orgId,
        operation: "diagnosis_generate",
        provider: "openai",
        success: true,
      });
    }
  }

  it("tracks usage summary", async () => {
    await recordN(2);
    const summary = await getUsageSummary(orgId);
    expect(summary.dailyUsed).toBe(2);
    expect(summary.remainingDaily).toBe(1);
  });

  it("blocks when daily limit reached", async () => {
    await recordN(3);
    await expect(assertAIQuota(orgId, "diagnosis_generate")).rejects.toBeInstanceOf(
      AIServiceError
    );
  });

  it("does not count failed calls toward quota display as success-only", async () => {
    await recordUsage({
      organizationId: orgId,
      operation: "copilot",
      provider: "openai",
      success: false,
    });
    const summary = await getUsageSummary(orgId);
    expect(summary.dailyUsed).toBe(0);
  });
});
