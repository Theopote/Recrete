import { shouldUseDatabase } from "@/lib/db/resolve";
import { prisma } from "@/lib/db/prisma";
import { generateId } from "@/lib/mock-data";
import type { TrialFeedbackInput } from "@/lib/validators/trial-feedback";

export interface TrialFeedbackRecord {
  id: string;
  organizationId: string;
  userId: string;
  userName: string;
  userEmail: string;
  kind: TrialFeedbackInput["kind"];
  step?: TrialFeedbackInput["step"] | null;
  pagePath?: string | null;
  projectId?: string | null;
  aiValueRating?: number | null;
  isBlocker: boolean;
  confusingText?: string | null;
  notes: string;
  createdAt: Date;
}

const memoryFeedbacks: TrialFeedbackRecord[] = [];

type PrismaWithTrialFeedback = typeof prisma & {
  trialFeedback: {
    findMany: (args: {
      where?: { organizationId?: string };
      orderBy: { createdAt: "desc" };
      take?: number;
    }) => Promise<
      Array<{
        id: string;
        organizationId: string;
        userId: string;
        userName: string;
        userEmail: string;
        kind: TrialFeedbackInput["kind"];
        step: TrialFeedbackInput["step"] | null;
        pagePath: string | null;
        projectId: string | null;
        aiValueRating: number | null;
        isBlocker: boolean;
        confusingText: string | null;
        notes: string;
        createdAt: Date;
      }>
    >;
    create: (args: {
      data: {
        organizationId: string;
        userId: string;
        userName: string;
        userEmail: string;
        kind: TrialFeedbackInput["kind"];
        step?: TrialFeedbackInput["step"] | null;
        pagePath?: string | null;
        projectId?: string | null;
        aiValueRating?: number | null;
        isBlocker: boolean;
        confusingText?: string | null;
        notes: string;
      };
    }) => Promise<{
      id: string;
      organizationId: string;
      userId: string;
      userName: string;
      userEmail: string;
      kind: TrialFeedbackInput["kind"];
      step: TrialFeedbackInput["step"] | null;
      pagePath: string | null;
      projectId: string | null;
      aiValueRating: number | null;
      isBlocker: boolean;
      confusingText: string | null;
      notes: string;
      createdAt: Date;
    }>;
  };
};

const db = prisma as PrismaWithTrialFeedback;

function mapRow(row: {
  id: string;
  organizationId: string;
  userId: string;
  userName: string;
  userEmail: string;
  kind: TrialFeedbackInput["kind"];
  step: TrialFeedbackInput["step"] | null;
  pagePath: string | null;
  projectId: string | null;
  aiValueRating: number | null;
  isBlocker: boolean;
  confusingText: string | null;
  notes: string;
  createdAt: Date;
}): TrialFeedbackRecord {
  return {
    id: row.id,
    organizationId: row.organizationId,
    userId: row.userId,
    userName: row.userName,
    userEmail: row.userEmail,
    kind: row.kind,
    step: row.step,
    pagePath: row.pagePath,
    projectId: row.projectId,
    aiValueRating: row.aiValueRating,
    isBlocker: row.isBlocker,
    confusingText: row.confusingText,
    notes: row.notes,
    createdAt: row.createdAt,
  };
}

export async function submitTrialFeedback(
  user: { id: string; organizationId: string; name: string; email: string },
  input: TrialFeedbackInput
): Promise<TrialFeedbackRecord> {
  const payload = {
    organizationId: user.organizationId,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    kind: input.kind,
    step: input.step ?? null,
    pagePath: input.pagePath ?? null,
    projectId: input.projectId ?? null,
    aiValueRating: input.aiValueRating ?? null,
    isBlocker: input.isBlocker ?? false,
    confusingText: input.confusingText?.trim() || null,
    notes: input.notes.trim(),
  };

  if (await shouldUseDatabase()) {
    const created = await db.trialFeedback.create({ data: payload });
    return mapRow(created);
  }

  const record: TrialFeedbackRecord = {
    id: generateId("trial-fb"),
    ...payload,
    createdAt: new Date(),
  };
  memoryFeedbacks.unshift(record);
  return record;
}

export async function listTrialFeedback(options?: {
  organizationId?: string;
  limit?: number;
}): Promise<TrialFeedbackRecord[]> {
  const limit = options?.limit ?? 200;

  if (await shouldUseDatabase()) {
    const rows = await db.trialFeedback.findMany({
      where: options?.organizationId
        ? { organizationId: options.organizationId }
        : undefined,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map(mapRow);
  }

  let rows = [...memoryFeedbacks];
  if (options?.organizationId) {
    rows = rows.filter((r) => r.organizationId === options.organizationId);
  }
  return rows
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

export function clearTrialFeedbackMemory() {
  memoryFeedbacks.length = 0;
}
