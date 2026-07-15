import { prisma } from "@/lib/db/prisma";
import type {
  BackgroundJobRecord,
  BackgroundJobStatus,
  BackgroundJobType,
  EnqueueJobInput,
} from "@/lib/jobs/types";
import type { BackgroundJobStatus as PrismaJobStatus, BackgroundJobType as PrismaJobType } from "@prisma/client";

function mapJob(row: {
  id: string;
  type: PrismaJobType;
  status: PrismaJobStatus;
  projectId: string | null;
  payload: unknown;
  result: unknown;
  error: string | null;
  attempts: number;
  maxAttempts: number;
  progress: number;
  phase: string | null;
  message: string | null;
  runAfter: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): BackgroundJobRecord {
  return {
    id: row.id,
    type: row.type as BackgroundJobRecord["type"],
    status: row.status as BackgroundJobStatus,
    projectId: row.projectId,
    payload: row.payload as BackgroundJobRecord["payload"],
    result: row.result ?? undefined,
    error: row.error,
    attempts: row.attempts,
    maxAttempts: row.maxAttempts,
    progress: row.progress,
    phase: row.phase,
    message: row.message,
    runAfter: row.runAfter,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function enqueueDbJob(input: EnqueueJobInput): Promise<BackgroundJobRecord> {
  const projectId =
    input.projectId ??
    ("projectId" in input.payload ? input.payload.projectId : undefined);

  const row = await prisma.backgroundJob.create({
    data: {
      type: input.type as PrismaJobType,
      projectId,
      payload: input.payload as object,
      maxAttempts: input.maxAttempts ?? 3,
      runAfter: input.runAfter ?? new Date(),
      phase: "queued",
      message: "Queued",
    },
  });
  return mapJob(row);
}

export async function getDbJob(jobId: string): Promise<BackgroundJobRecord | null> {
  const row = await prisma.backgroundJob.findUnique({ where: { id: jobId } });
  return row ? mapJob(row) : null;
}

export async function claimNextDbJob(): Promise<BackgroundJobRecord | null> {
  const now = new Date();
  const row = await prisma.$transaction(async (tx) => {
    const next = await tx.backgroundJob.findFirst({
      where: { status: "pending", runAfter: { lte: now } },
      orderBy: { runAfter: "asc" },
    });
    if (!next) return null;

    return tx.backgroundJob.update({
      where: { id: next.id },
      data: {
        status: "processing",
        attempts: { increment: 1 },
        startedAt: now,
      },
    });
  });
  return row ? mapJob(row) : null;
}

export async function updateDbJob(
  jobId: string,
  patch: Partial<
    Pick<
      BackgroundJobRecord,
      | "status"
      | "result"
      | "error"
      | "progress"
      | "phase"
      | "message"
      | "completedAt"
      | "runAfter"
      | "attempts"
    >
  >
): Promise<BackgroundJobRecord | null> {
  try {
    const row = await prisma.backgroundJob.update({
      where: { id: jobId },
      data: {
        status: patch.status as PrismaJobStatus | undefined,
        result: patch.result === undefined ? undefined : (patch.result as object),
        error: patch.error,
        progress: patch.progress,
        phase: patch.phase,
        message: patch.message,
        completedAt: patch.completedAt,
        runAfter: patch.runAfter,
        attempts: patch.attempts,
      },
    });
    return mapJob(row);
  } catch {
    return null;
  }
}

export async function listDbJobsByStatus(status: BackgroundJobStatus): Promise<BackgroundJobRecord[]> {
  const rows = await prisma.backgroundJob.findMany({
    where: { status: status as PrismaJobStatus },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapJob);
}
