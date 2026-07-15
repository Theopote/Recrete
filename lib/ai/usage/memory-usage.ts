import type { AIUsageSummary, RecordAIUsageInput } from "./types";

interface UsageRow {
  organizationId: string;
  userId?: string;
  operation: string;
  provider: string;
  modelName?: string;
  success: boolean;
  createdAt: Date;
}

const events: UsageRow[] = [];

function startOfDay(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function getDailyLimit(): number {
  return Number(process.env.AI_DAILY_ORG_LIMIT ?? 50);
}

export function getMonthlyLimit(): number {
  return Number(process.env.AI_MONTHLY_ORG_LIMIT ?? 500);
}

export async function countUsageSince(
  organizationId: string,
  since: Date
): Promise<number> {
  return events.filter(
    (e) =>
      e.organizationId === organizationId &&
      e.success &&
      e.createdAt >= since
  ).length;
}

export async function getUsageSummary(
  organizationId: string
): Promise<AIUsageSummary> {
  const dailyUsed = await countUsageSince(organizationId, startOfDay());
  const monthlyUsed = await countUsageSince(organizationId, startOfMonth());
  const dailyLimit = getDailyLimit();
  const monthlyLimit = getMonthlyLimit();
  return {
    dailyUsed,
    dailyLimit,
    monthlyUsed,
    monthlyLimit,
    remainingDaily: Math.max(0, dailyLimit - dailyUsed),
    remainingMonthly: Math.max(0, monthlyLimit - monthlyUsed),
  };
}

export async function recordUsage(input: RecordAIUsageInput): Promise<void> {
  events.push({
    organizationId: input.organizationId,
    userId: input.userId,
    operation: input.operation,
    provider: input.provider,
    modelName: input.modelName,
    success: input.success,
    createdAt: new Date(),
  });
}

/** Test helper */
export function clearMemoryUsage(): void {
  events.length = 0;
}
