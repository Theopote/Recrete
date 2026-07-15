import "server-only";

import { normalizeAIError } from "@/lib/ai/errors";
import { getAIServiceMode, isRealAIEnabled } from "@/lib/ai/model-router";
import { assertAIQuota, recordUsage } from "@/lib/ai/usage";
import type { AIOperation } from "@/lib/ai/usage";

export interface InvokeAIContext {
  organizationId: string;
  userId?: string;
  operation: AIOperation;
  modelName?: string;
}

export async function withAIInvocation<T>(
  ctx: InvokeAIContext,
  fn: () => Promise<T>
): Promise<T> {
  if (isRealAIEnabled()) {
    await assertAIQuota(ctx.organizationId, ctx.operation);
  }

  const mode = getAIServiceMode();
  try {
    const result = await fn();
    if (isRealAIEnabled()) {
      await recordUsage({
        organizationId: ctx.organizationId,
        userId: ctx.userId,
        operation: ctx.operation,
        provider: mode === "openai" ? "openai" : "mock",
        modelName: ctx.modelName,
        success: true,
      });
    }
    return result;
  } catch (error) {
    const normalized = normalizeAIError(error);
    if (isRealAIEnabled()) {
      await recordUsage({
        organizationId: ctx.organizationId,
        userId: ctx.userId,
        operation: ctx.operation,
        provider: mode === "openai" ? "openai" : "mock",
        modelName: ctx.modelName,
        success: false,
      }).catch(() => {});
    }
    throw normalized;
  }
}
