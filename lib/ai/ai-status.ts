import "server-only";

import { getAIServiceMode, isOpenAIConfigured } from "@/lib/ai/model-router";
import { getUsageSummary } from "@/lib/ai/usage";

export interface AIStatusPayload {
  mode: "mock" | "openai";
  live: boolean;
  langChainEnabled: boolean;
  usage?: {
    dailyUsed: number;
    dailyLimit: number;
    monthlyUsed: number;
    monthlyLimit: number;
    remainingDaily: number;
    remainingMonthly: number;
  };
}

export async function getAIStatus(
  organizationId?: string
): Promise<AIStatusPayload> {
  const mode = getAIServiceMode();
  const payload: AIStatusPayload = {
    mode,
    live: isOpenAIConfigured(),
    langChainEnabled: process.env.LANGCHAIN_ENABLED === "true",
  };

  if (organizationId) {
    payload.usage = await getUsageSummary(organizationId);
  }

  return payload;
}
