import "server-only";

import type { BackgroundJobPayload, BackgroundJobType } from "@/lib/jobs/types";

let queuePromise: Promise<import("bullmq").Queue> | null = null;

export function isBullMQEnabled() {
  return Boolean(process.env.REDIS_URL);
}

async function getQueue() {
  if (!isBullMQEnabled()) {
    throw new Error("REDIS_URL is not configured");
  }
  if (!queuePromise) {
    queuePromise = (async () => {
      const { Queue } = await import("bullmq");
      return new Queue("recrete-jobs", {
        connection: { url: process.env.REDIS_URL! },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: "exponential", delay: 5000 },
          removeOnComplete: 100,
          removeOnFail: 200,
        },
      });
    })();
  }
  return queuePromise;
}

export async function dispatchViaBullMQ(
  jobId: string,
  type: BackgroundJobType,
  payload: BackgroundJobPayload
) {
  const queue = await getQueue();
  await queue.add(type, { jobId, payload }, { jobId });
}

export async function createBullMQWorker() {
  if (!isBullMQEnabled()) {
    throw new Error("REDIS_URL is not configured");
  }

  const { Worker } = await import("bullmq");
  const { processJobById } = await import("@/lib/jobs/processor");

  return new Worker(
    "recrete-jobs",
    async (bullJob) => {
      const jobId = bullJob.data.jobId as string;
      if (!jobId) throw new Error("Missing jobId in BullMQ payload");
      await processJobById(jobId);
    },
    { connection: { url: process.env.REDIS_URL! }, concurrency: 2 }
  );
}
