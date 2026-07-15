export type BackgroundJobType = "document_ingest" | "bim_cad_conversion";

export type BackgroundJobStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export interface DocumentIngestJobPayload {
  projectId: string;
  documentId: string;
  taskId?: string;
  language?: "auto" | "zh" | "en";
  createIssues?: boolean;
  refreshBuildingMemory?: boolean;
}

export interface BimCadConversionJobPayload {
  projectId: string;
  modelId: string;
  fileUrl: string;
  format: "dwg" | "dxf";
}

export type BackgroundJobPayload = DocumentIngestJobPayload | BimCadConversionJobPayload;

export interface BackgroundJobRecord {
  id: string;
  type: BackgroundJobType;
  status: BackgroundJobStatus;
  projectId?: string | null;
  payload: BackgroundJobPayload;
  result?: unknown;
  error?: string | null;
  attempts: number;
  maxAttempts: number;
  progress: number;
  phase?: string | null;
  message?: string | null;
  runAfter: Date;
  startedAt?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnqueueJobInput {
  type: BackgroundJobType;
  payload: BackgroundJobPayload;
  projectId?: string;
  maxAttempts?: number;
  runAfter?: Date;
}

export interface EnqueueJobOptions {
  /** Process immediately in-process (tests / worker script) */
  inline?: boolean;
}
