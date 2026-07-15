import "server-only";

import { createBullMQWorker } from "@/lib/jobs/bullmq";

async function main() {
  if (!process.env.REDIS_URL) {
    console.error("[job-worker] REDIS_URL is required. Set REDIS_URL in .env to start the BullMQ worker.");
    process.exit(1);
  }

  const worker = await createBullMQWorker();
  console.log("[job-worker] BullMQ worker started on queue: recrete-jobs");

  const shutdown = async () => {
    console.log("[job-worker] Shutting down…");
    await worker.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error("[job-worker] Fatal error:", error);
  process.exit(1);
});
