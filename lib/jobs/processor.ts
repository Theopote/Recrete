import "server-only";

import { claimNextJob, getJob, updateJob } from "@/lib/jobs/jobs-store";
import { executeJobHandler } from "@/lib/jobs/handlers";
import type { BackgroundJobRecord } from "@/lib/jobs/types";

const RETRY_DELAY_MS = 5000;

function retryAt(attempts: number) {
  return new Date(Date.now() + RETRY_DELAY_MS * attempts);
}

export async function processJobById(jobId: string): Promise<BackgroundJobRecord | null> {
  const job = await getJob(jobId);
  if (!job) return null;

  if (job.status === "completed" || job.status === "failed" || job.status === "cancelled") {
    return job;
  }

  if (job.status === "pending") {
    await updateJob(jobId, {
      status: "processing",
      phase: "starting",
      message: "Job started",
      attempts: job.attempts + 1,
    });
  }

  try {
    const current = await getJob(jobId);
    if (!current) return null;

    await updateJob(jobId, { phase: "running", message: `Running ${current.type}` });
    const result = await executeJobHandler(current);

    return updateJob(jobId, {
      status: "completed",
      result,
      progress: 100,
      phase: "completed",
      message: "Job completed",
      completedAt: new Date(),
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Job failed";
    const current = await getJob(jobId);
    if (!current) return null;

    if (current.attempts < current.maxAttempts) {
      return updateJob(jobId, {
        status: "pending",
        error: message,
        phase: "retry_scheduled",
        message: `Retry scheduled (${current.attempts}/${current.maxAttempts}): ${message}`,
        completedAt: null,
        runAfter: retryAt(current.attempts),
      });
    }

    return updateJob(jobId, {
      status: "failed",
      error: message,
      phase: "failed",
      message,
      completedAt: new Date(),
    });
  }
}

export async function processNextPendingJob(): Promise<BackgroundJobRecord | null> {
  const job = await claimNextJob();
  if (!job) return null;
  return processJobById(job.id);
}

export async function drainPendingJobs(limit = 10): Promise<number> {
  let processed = 0;
  for (let i = 0; i < limit; i++) {
    const result = await processNextPendingJob();
    if (!result) break;
    processed += 1;
  }
  return processed;
}
