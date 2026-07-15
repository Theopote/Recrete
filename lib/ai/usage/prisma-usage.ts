import { prisma } from "@/lib/db/prisma";
import type { AIUsageSummary, RecordAIUsageInput } from "./types";
import {
  countUsageSince as memoryCount,
  getDailyLimit,
  getMonthlyLimit,
  getUsageSummary as memorySummary,
  recordUsage as memoryRecord,
} from "./memory-usage";

/** Until `prisma generate` picks up AIUsageEvent, extend client typing locally. */
type PrismaWithAIUsage = typeof prisma & {
  aIUsageEvent: {
    count: (args: {
      where: {
        organizationId: string;
        success: boolean;
        createdAt: { gte: Date };
      };
    }) => Promise<number>;
    create: (args: {
      data: {
        organizationId: string;
        userId?: string | null;
        operation: string;
        provider: string;
        modelName?: string | null;
        success: boolean;
      };
    }) => Promise<unknown>;
  };
};

const db = prisma as PrismaWithAIUsage;

function startOfDay(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function useDatabase(): boolean {
  return process.env.USE_DATABASE === "true";
}

export async function countUsageSince(
  organizationId: string,
  since: Date
): Promise<number> {
  if (!useDatabase()) return memoryCount(organizationId, since);
  return db.aIUsageEvent.count({
    where: {
      organizationId,
      success: true,
      createdAt: { gte: since },
    },
  });
}

export async function getUsageSummary(
  organizationId: string
): Promise<AIUsageSummary> {
  if (!useDatabase()) return memorySummary(organizationId);

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
  if (!useDatabase()) {
    await memoryRecord(input);
    return;
  }
  await db.aIUsageEvent.create({
    data: {
      organizationId: input.organizationId,
      userId: input.userId,
      operation: input.operation,
      provider: input.provider,
      modelName: input.modelName ?? null,
      success: input.success,
    },
  });
}
