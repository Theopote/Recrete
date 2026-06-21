import "server-only";

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

export function createDocumentAnalysisTask(input: {
  projectId: string;
  documentId: string;
  documentName: string;
}): DocumentAnalysisTask {
  const id = `task-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
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

export function updateDocumentAnalysisTask(
  taskId: string,
  patch: Partial<
    Pick<DocumentAnalysisTask, "status" | "phase" | "progress" | "message" | "error">
  >
): DocumentAnalysisTask | null {
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

export function completeDocumentAnalysisTask(taskId: string, message = "Analysis complete") {
  return updateDocumentAnalysisTask(taskId, {
    status: "completed",
    phase: "completed",
    progress: 100,
    message,
  });
}

export function failDocumentAnalysisTask(taskId: string, error: string) {
  return updateDocumentAnalysisTask(taskId, {
    status: "failed",
    phase: "failed",
    error,
    message: error,
  });
}

export function getDocumentAnalysisTask(taskId: string): DocumentAnalysisTask | null {
  return tasks.get(taskId) ?? null;
}

export function listDocumentAnalysisTasks(projectId: string): DocumentAnalysisTask[] {
  return [...tasks.values()]
    .filter((t) => t.projectId === projectId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
