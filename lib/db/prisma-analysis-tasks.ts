import { prisma } from "@/lib/db/prisma";
import type { DocumentAnalysisTask } from "@/lib/ai/tasks/document-analysis-tasks";
import type { AnalysisTaskPhase, AnalysisTaskStatus } from "@/lib/ai/tasks/document-analysis-tasks";

function mapTask(row: {
  id: string;
  projectId: string;
  documentId: string;
  documentName: string;
  status: string;
  phase: string;
  progress: number;
  message: string | null;
  error: string | null;
  jobId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): DocumentAnalysisTask {
  return {
    id: row.id,
    projectId: row.projectId,
    documentId: row.documentId,
    documentName: row.documentName,
    status: row.status as AnalysisTaskStatus,
    phase: row.phase as AnalysisTaskPhase,
    progress: row.progress,
    message: row.message ?? undefined,
    error: row.error ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function createDbAnalysisTask(input: {
  id: string;
  projectId: string;
  documentId: string;
  documentName: string;
  jobId?: string;
}): Promise<DocumentAnalysisTask> {
  const row = await prisma.documentAnalysisTaskRecord.create({
    data: {
      id: input.id,
      projectId: input.projectId,
      documentId: input.documentId,
      documentName: input.documentName,
      status: "queued",
      phase: "queued",
      progress: 0,
      message: "Queued for analysis",
      jobId: input.jobId ?? null,
    },
  });
  return mapTask(row);
}

export async function updateDbAnalysisTask(
  taskId: string,
  patch: Partial<Pick<DocumentAnalysisTask, "status" | "phase" | "progress" | "message" | "error">>
): Promise<DocumentAnalysisTask | null> {
  try {
    const row = await prisma.documentAnalysisTaskRecord.update({
      where: { id: taskId },
      data: {
        status: patch.status,
        phase: patch.phase,
        progress: patch.progress,
        message: patch.message,
        error: patch.error,
      },
    });
    return mapTask(row);
  } catch {
    return null;
  }
}

export async function getDbAnalysisTask(taskId: string): Promise<DocumentAnalysisTask | null> {
  const row = await prisma.documentAnalysisTaskRecord.findUnique({ where: { id: taskId } });
  return row ? mapTask(row) : null;
}
