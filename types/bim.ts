export type BimModelFormat = "ifc" | "dwg" | "dxf";

export type BimModelStatus =
  | "ready"
  | "processing"
  | "failed"
  | "unsupported";

export interface BimModelMetadata {
  entityCount?: number;
  layerCount?: number;
  bounds?: { minX: number; minY: number; maxX: number; maxY: number };
}

export interface BimModel {
  id: string;
  projectId: string;
  name: string;
  format: BimModelFormat;
  status: BimModelStatus;
  fileUrl: string;
  previewUrl?: string | null;
  fileSize: number;
  mimeType: string;
  errorMessage?: string | null;
  metadata?: BimModelMetadata;
  uploadedById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BimModelUploadResult extends BimModel {
  conversionQueued?: boolean;
}
