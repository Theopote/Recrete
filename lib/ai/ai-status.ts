import "server-only";

import { getAIServiceMode, isOpenAIConfigured } from "@/lib/ai/model-router";
import { getUsageSummary } from "@/lib/ai/usage";
import { getWebSearchProvider, isWebSearchConfigured } from "@/lib/ai/knowledge/web-search";

export interface AIStatusPayload {
  mode: "mock" | "openai";
  live: boolean;
  langChainEnabled: boolean;
  webSearchEnabled: boolean;
  webSearchProvider: string | null;
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
    webSearchEnabled: isWebSearchConfigured(),
    webSearchProvider: getWebSearchProvider(),
  };

  if (organizationId) {
    payload.usage = await getUsageSummary(organizationId);
  }

  return payload;
}
