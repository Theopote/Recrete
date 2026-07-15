import { shouldUseDatabase } from "@/lib/db/resolve";
import * as memory from "@/lib/jobs/memory-jobs";
import * as db from "@/lib/jobs/prisma-jobs";
import type {
  BackgroundJobRecord,
  BackgroundJobStatus,
  EnqueueJobInput,
} from "@/lib/jobs/types";

async function resolveDb() {
  return shouldUseDatabase();
}

export async function enqueueJob(input: EnqueueJobInput): Promise<BackgroundJobRecord> {
  if (await resolveDb()) return db.enqueueDbJob(input);
  return memory.enqueueMemoryJob(input);
}

export async function getJob(jobId: string): Promise<BackgroundJobRecord | null> {
  if (await resolveDb()) return db.getDbJob(jobId);
  return memory.getMemoryJob(jobId);
}

export async function claimNextJob(): Promise<BackgroundJobRecord | null> {
  if (await resolveDb()) return db.claimNextDbJob();
  return memory.claimNextMemoryJob();
}

export async function updateJob(
  jobId: string,
  patch: Parameters<typeof db.updateDbJob>[1]
): Promise<BackgroundJobRecord | null> {
  if (await resolveDb()) return db.updateDbJob(jobId, patch);
  return memory.updateMemoryJob(jobId, patch);
}

export async function listJobsByStatus(status: BackgroundJobStatus): Promise<BackgroundJobRecord[]> {
  if (await resolveDb()) return db.listDbJobsByStatus(status);
  return memory.listMemoryJobsByStatus(status);
}

export { resetMemoryJobs } from "@/lib/jobs/memory-jobs";
