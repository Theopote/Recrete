import { AIServiceError } from "@/lib/ai/errors";
import { getDailyLimit, getMonthlyLimit } from "./memory-usage";
import { countUsageSince } from "./prisma-usage";
import type { AIOperation } from "./types";

function startOfDay(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export async function assertAIQuota(
  organizationId: string,
  _operation: AIOperation
): Promise<void> {
  const dailyLimit = getDailyLimit();
  const monthlyLimit = getMonthlyLimit();

  const [dailyUsed, monthlyUsed] = await Promise.all([
    countUsageSince(organizationId, startOfDay()),
    countUsageSince(organizationId, startOfMonth()),
  ]);

  if (dailyUsed >= dailyLimit) {
    throw new AIServiceError({
      code: "AI_QUOTA_EXCEEDED",
      messageZh: `本事务所今日 AI 调用已达上限（${dailyLimit} 次/日），请明日再试。`,
      retryable: false,
      statusCode: 429,
    });
  }

  if (monthlyUsed >= monthlyLimit) {
    throw new AIServiceError({
      code: "AI_QUOTA_EXCEEDED",
      messageZh: `本事务所本月 AI 调用已达上限（${monthlyLimit} 次/月），请联系管理员。`,
      retryable: false,
      statusCode: 429,
    });
  }
}
