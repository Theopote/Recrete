import { describe, it, expect, beforeEach } from "vitest";
import { resetMemoryJobs } from "@/lib/jobs/jobs-store";
import { enqueueJob, getJob } from "@/lib/jobs/jobs-store";
import { processJobById } from "@/lib/jobs/processor";

describe("background job queue", () => {
  beforeEach(() => {
    resetMemoryJobs();
  });

  it("enqueues and completes a BIM conversion job (mock handler path)", async () => {
    const job = await enqueueJob({
      type: "bim_cad_conversion",
      projectId: "proj-demo",
      payload: {
        projectId: "proj-demo",
        modelId: "bim-test",
        fileUrl: "/uploads/proj-demo/missing.dwg",
        format: "dwg",
      },
    });

    expect(job.status).toBe("pending");

    const processed = await processJobById(job.id);
    expect(processed?.status).toBe("failed");

    const stored = await getJob(job.id);
    expect(stored?.attempts).toBeGreaterThan(0);
  });
});
