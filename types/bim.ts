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

export interface BimLayoutAssignment {
  roomId: string;
  roomLabel: string;
  area: number;
  assignedFunction: string;
  assignedFunctionZh: string;
  fitScore: number;
  rationale: string;
}

export interface BimLayoutOptimization {
  targetFunction: string;
  totalArea: number;
  assignments: BimLayoutAssignment[];
  overallScore: number;
  suggestions: string[];
  unassignedZones: string[];
}

export interface BimFlowNodeMetrics {
  roomId: string;
  label: string;
  area: number;
  betweenness: number;
  estimatedPeakFlow: number;
  densityLevel: "low" | "medium" | "high" | "critical";
  isBottleneck: boolean;
}

export interface BimFlowSimulation {
  peakOccupancyEstimate: number;
  averagePathLength: number;
  bottleneckCount: number;
  nodes: BimFlowNodeMetrics[];
  hotspots: string[];
  recommendations: string[];
  unitScale: number;
}

export interface BimFurnitureItem {
  id: string;
  name: string;
  nameZh: string;
  category: string;
  width: number;
  depth: number;
  unit: "m";
  position?: BimPoint2D;
  rotation?: number;
  note?: string;
}

export interface BimRoomFurniturePlan {
  roomId: string;
  roomLabel: string;
  area: number;
  functionType: string;
  items: BimFurnitureItem[];
  utilizationRate: number;
  clearanceNote: string;
}

export interface BimFurniturePlanning {
  plans: BimRoomFurniturePlan[];
  totalItems: number;
  averageUtilization: number;
  globalNotes: string[];
}

export interface BimSpatialAnalytics {
  circulation: BimCirculationAnalysis;
  roomCosts: BimRoomCostCell[];
  estimatedCostPerSqm: number;
  estimatedTotalCost: number;
  currency: "CNY";
  layout?: BimLayoutOptimization;
  flow?: BimFlowSimulation;
  furniture?: BimFurniturePlanning;
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
