import "server-only";

import { shouldUseDatabase } from "@/lib/db/resolve";
import * as db from "@/lib/db/prisma-analysis-tasks";

export type AnalysisTaskPhase =
  | "queued"
  | "reading_file"
  | "vision_analysis"
  | "opencv_enrichment"
  | "persisting"
  | "building_memory"
  | "completed"
  | "failed";

export type AnalysisTaskStatus = "queued" | "processing" | "completed" | "failed";

export interface DocumentAnalysisTask {
  id: string;
  projectId: string;
  documentId: string;
  documentName: string;
  status: AnalysisTaskStatus;
  phase: AnalysisTaskPhase;
  progress: number;
  message?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

const tasks = new Map<string, DocumentAnalysisTask>();

function now() {
  return new Date().toISOString();
}

function generateTaskId() {
  return `task-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function createDocumentAnalysisTask(input: {
  projectId: string;
  documentId: string;
  documentName: string;
  jobId?: string;
}): Promise<DocumentAnalysisTask> {
  const id = generateTaskId();

  if (await shouldUseDatabase()) {
    return db.createDbAnalysisTask({ id, ...input });
  }

  const task: DocumentAnalysisTask = {
    id,
    projectId: input.projectId,
    documentId: input.documentId,
    documentName: input.documentName,
    status: "queued",
    phase: "queued",
    progress: 0,
    message: "Queued for analysis",
    createdAt: now(),
    updatedAt: now(),
  };
  tasks.set(id, task);
  return task;
}

export async function updateDocumentAnalysisTask(
  taskId: string,
  patch: Partial<
    Pick<DocumentAnalysisTask, "status" | "phase" | "progress" | "message" | "error">
  >
): Promise<DocumentAnalysisTask | null> {
  if (await shouldUseDatabase()) {
    return db.updateDbAnalysisTask(taskId, patch);
  }

  const task = tasks.get(taskId);
  if (!task) return null;
  const updated: DocumentAnalysisTask = {
    ...task,
    ...patch,
    updatedAt: now(),
  };
  tasks.set(taskId, updated);
  return updated;
}

export async function completeDocumentAnalysisTask(taskId: string, message = "Analysis complete") {
  return updateDocumentAnalysisTask(taskId, {
    status: "completed",
    phase: "completed",
    progress: 100,
    message,
  });
}

export async function failDocumentAnalysisTask(taskId: string, error: string) {
  return updateDocumentAnalysisTask(taskId, {
    status: "failed",
    phase: "failed",
    error,
    message: error,
  });
}

export async function getDocumentAnalysisTask(taskId: string): Promise<DocumentAnalysisTask | null> {
  if (await shouldUseDatabase()) {
    return db.getDbAnalysisTask(taskId);
  }
  return tasks.get(taskId) ?? null;
}

import { updateDocumentAnalysisTask } from "@/lib/ai/tasks/document-analysis-tasks";

export async function linkAnalysisTaskToJob(
  taskId: string,
  jobId: string
): Promise<void> {
  await updateDocumentAnalysisTask(taskId, {
    message: `Queued (job ${jobId})`,
  });

  const { shouldUseDatabase } = await import("@/lib/db/resolve");
  if (await shouldUseDatabase()) {
    const { prisma } = await import("@/lib/db/prisma");
    await prisma.documentAnalysisTaskRecord.update({
      where: { id: taskId },
      data: { jobId },
    });
  }
}

export function listDocumentAnalysisTasks(projectId: string): DocumentAnalysisTask[] {
  return [...tasks.values()]
    .filter((t) => t.projectId === projectId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function resetDocumentAnalysisTasks() {
  tasks.clear();
}
