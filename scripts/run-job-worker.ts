/**
 * BullMQ worker for Recrete background jobs.
 * Requires REDIS_URL and USE_DATABASE=true for durable job records.
 *
 * Usage: REDIS_URL=redis://localhost:6379 USE_DATABASE=true tsx scripts/run-job-worker.ts
 */
import { createBullMQWorker } from "@/lib/jobs/bullmq";
import { drainPendingJobs } from "@/lib/jobs/processor";

async function main() {
  const useRedis = Boolean(process.env.REDIS_URL);

  if (useRedis) {
    console.log("[worker] Starting BullMQ worker on", process.env.REDIS_URL);
    const worker = await createBullMQWorker();
    worker.on("completed", (job) => {
      console.log(`[worker] Completed BullMQ job ${job.id}`);
    });
    worker.on("failed", (job, err) => {
      console.error(`[worker] Failed BullMQ job ${job?.id}:`, err.message);
    });

    process.on("SIGINT", async () => {
      await worker.close();
      process.exit(0);
    });
    return;
  }

  console.log("[worker] REDIS_URL not set — polling Prisma/memory queue every 3s");
  const tick = async () => {
    const processed = await drainPendingJobs(5);
    if (processed > 0) {
      console.log(`[worker] Processed ${processed} job(s)`);
    }
  };

  await tick();
  setInterval(tick, 3000);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
