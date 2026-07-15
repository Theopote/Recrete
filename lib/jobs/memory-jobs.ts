import type { BackgroundJobRecord, BackgroundJobStatus, EnqueueJobInput } from "@/lib/jobs/types";

const jobs = new Map<string, BackgroundJobRecord>();

function generateJobId() {
  return `job-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function enqueueMemoryJob(input: EnqueueJobInput): Promise<BackgroundJobRecord> {
  const now = new Date();
  const job: BackgroundJobRecord = {
    id: generateJobId(),
    type: input.type,
    status: "pending",
    projectId: input.projectId ?? ("projectId" in input.payload ? input.payload.projectId : null),
    payload: input.payload,
    attempts: 0,
    maxAttempts: input.maxAttempts ?? 3,
    progress: 0,
    phase: "queued",
    message: "Queued",
    runAfter: input.runAfter ?? now,
    createdAt: now,
    updatedAt: now,
  };
  jobs.set(job.id, job);
  return job;
}

export async function getMemoryJob(jobId: string): Promise<BackgroundJobRecord | null> {
  return jobs.get(jobId) ?? null;
}

export async function claimNextMemoryJob(): Promise<BackgroundJobRecord | null> {
  const now = Date.now();
  const pending = [...jobs.values()]
    .filter((j) => j.status === "pending" && j.runAfter.getTime() <= now)
    .sort((a, b) => a.runAfter.getTime() - b.runAfter.getTime());
  const job = pending[0];
  if (!job) return null;

  job.status = "processing";
  job.attempts += 1;
  job.startedAt = new Date();
  job.updatedAt = new Date();
  jobs.set(job.id, job);
  return job;
}

export async function updateMemoryJob(
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
  const job = jobs.get(jobId);
  if (!job) return null;
  const updated = { ...job, ...patch, updatedAt: new Date() };
  jobs.set(jobId, updated);
  return updated;
}

export async function listMemoryJobsByStatus(
  status: BackgroundJobStatus
): Promise<BackgroundJobRecord[]> {
  return [...jobs.values()].filter((j) => j.status === status);
}

export function resetMemoryJobs() {
  jobs.clear();
}
