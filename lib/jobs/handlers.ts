import "server-only";

import { runDocumentIngestWorkflow } from "@/lib/ai/workflow/document-ingest-workflow";
import { processCadConversion } from "@/lib/bim/process-model-upload";
import type {
  BackgroundJobRecord,
  BimCadConversionJobPayload,
  DocumentIngestJobPayload,
} from "@/lib/jobs/types";

export async function handleDocumentIngestJob(
  job: BackgroundJobRecord
): Promise<unknown> {
  const payload = job.payload as DocumentIngestJobPayload;
  const result = await runDocumentIngestWorkflow(
    payload.projectId,
    payload.organizationId,
    payload.documentId,
    {
    language: payload.language,
    createIssues: payload.createIssues,
    refreshBuildingMemory: payload.refreshBuildingMemory,
    taskId: payload.taskId,
  });

  if (!result) {
    throw new Error(`Document ${payload.documentId} not found`);
  }

  return {
    documentId: result.document.id,
    issuesCreated: result.issuesCreated.length,
    analysisRunId: result.analysisRun.id,
  };
}

export async function handleBimCadConversionJob(
  job: BackgroundJobRecord
): Promise<unknown> {
  const payload = job.payload as BimCadConversionJobPayload;
  await processCadConversion(
    payload.projectId,
    payload.modelId,
    payload.fileUrl,
    payload.format
  );
  return { modelId: payload.modelId, status: "conversion_finished" };
}

export async function executeJobHandler(job: BackgroundJobRecord): Promise<unknown> {
  switch (job.type) {
    case "document_ingest":
      return handleDocumentIngestJob(job);
    case "bim_cad_conversion":
      return handleBimCadConversionJob(job);
    default:
      throw new Error(`Unknown job type: ${job.type as string}`);
  }
}
