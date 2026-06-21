export type BimModelFormat = "ifc" | "dwg" | "dxf";

export type BimModelStatus =
  | "ready"
  | "processing"
  | "failed"
  | "unsupported";

export interface BimPoint2D {
  x: number;
  y: number;
}

export interface BimRoomInfo {
  id: string;
  label: string;
  area: number;
  areaUnit: "m2";
  source: "ifc_space" | "ifc_geometry" | "cad_polyline";
  expressId?: number;
  layer?: string;
  centroid?: BimPoint2D;
  polygon?: BimPoint2D[];
}

export interface BimCirculationPath {
  id: string;
  fromRoomId: string;
  toRoomId: string;
  fromLabel: string;
  toLabel: string;
  roomIds: string[];
  points: BimPoint2D[];
  length: number;
  lengthUnit: "m";
}

export interface BimCirculationAnalysis {
  paths: BimCirculationPath[];
  mainSpine?: BimCirculationPath;
  adjacencyCount: number;
  averagePathLength?: number;
  unitScale: number;
}

export interface BimRoomCostCell {
  roomId: string;
  label: string;
  area: number;
  costPerSqm: number;
  totalCost: number;
  intensity: number;
  strategyImpact?: number;
}

export interface BimSpatialAnalytics {
  circulation: BimCirculationAnalysis;
  roomCosts: BimRoomCostCell[];
  estimatedCostPerSqm: number;
  estimatedTotalCost: number;
  currency: "CNY";
}

export interface BimModelMetadata {
  entityCount?: number;
  layerCount?: number;
  bounds?: { minX: number; minY: number; maxX: number; maxY: number };
  meshCount?: number;
  rooms?: BimRoomInfo[];
  totalArea?: number;
  totalAreaUnit?: "m2";
  unitScale?: number;
  circulation?: BimCirculationAnalysis;
  roomCosts?: BimRoomCostCell[];
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
