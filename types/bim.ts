export type BimModelFormat = "ifc" | "dwg" | "dxf";

export type BimModelStatus =
  | "ready"
  | "processing"
  | "failed"
  | "unsupported";

export interface BimRoomInfo {
  id: string;
  label: string;
  area: number;
  areaUnit: "m2";
  source: "ifc_space" | "ifc_geometry" | "cad_polyline";
  expressId?: number;
  layer?: string;
}

export interface BimModelMetadata {
  entityCount?: number;
  layerCount?: number;
  bounds?: { minX: number; minY: number; maxX: number; maxY: number };
  meshCount?: number;
  rooms?: BimRoomInfo[];
  totalArea?: number;
  totalAreaUnit?: "m2";
}

export interface BimModel {
  id: string;
  projectId: string;
  name: string;
  format: BimModelFormat;
  status: BimModelStatus;
  fileUrl: string;
  previewUrl?: string | null;
  gltfUrl?: string | null;
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
