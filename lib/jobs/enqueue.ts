import "server-only";

import { enqueueJob } from "@/lib/jobs/jobs-store";
import { processJobById } from "@/lib/jobs/processor";
import { dispatchViaBullMQ, isBullMQEnabled } from "@/lib/jobs/bullmq";
import type {
  BimCadConversionJobPayload,
  DocumentIngestJobPayload,
  EnqueueJobOptions,
  EnqueueJobInput,
} from "@/lib/jobs/types";

function getJobRunnerSecret() {
  return process.env.JOB_RUNNER_SECRET ?? "recrete-dev-job-secret";
}

function getBaseUrl() {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

async function dispatchViaInternalApi(jobId: string) {
  const secret = getJobRunnerSecret();
  const url = `${getBaseUrl()}/api/internal/jobs/${jobId}/run`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
    });
    if (!res.ok) {
      throw new Error(`Job dispatch failed: ${res.status}`);
    }
  } catch (error) {
    console.warn("[jobs] Internal dispatch failed, processing inline:", error);
    await processJobById(jobId);
  }
}

export async function enqueueAndDispatch(
  input: EnqueueJobInput,
  options: EnqueueJobOptions = {}
) {
  const job = await enqueueJob(input);

  if (options.inline) {
    await processJobById(job.id);
    return job;
  }

  if (isBullMQEnabled()) {
    await dispatchViaBullMQ(job.id, input.type, input.payload);
    return job;
  }

  void dispatchViaInternalApi(job.id);
  return job;
}

export async function enqueueDocumentIngestJob(
  payload: DocumentIngestJobPayload,
  options?: EnqueueJobOptions
) {
  return enqueueAndDispatch(
    { type: "document_ingest", payload, projectId: payload.projectId },
    options
  );
}

export async function enqueueBimCadConversionJob(
  payload: BimCadConversionJobPayload,
  options?: EnqueueJobOptions
) {
  return enqueueAndDispatch(
    { type: "bim_cad_conversion", payload, projectId: payload.projectId },
    options
  );
}
