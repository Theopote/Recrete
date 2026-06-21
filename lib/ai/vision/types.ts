// Vision AI types for document and image analysis

export interface DrawingAnalysisResult {
  drawingType: 'floor_plan' | 'elevation' | 'section' | 'detail' | 'structural' | 'mep' | 'unknown';
  scale?: string;
  orientation?: string;
  rooms: RoomInfo[];
  dimensions: DimensionInfo[];
  annotations: AnnotationInfo[];
  structuralElements: StructuralElement[];
  confidence: number;
  extractedText: string[];
  summary: string;
}

export interface RoomInfo {
  id: string;
  label: string;
  area?: number;
  dimensions?: { width?: number; height?: number };
  function?: string;
  location: BoundingBox;
}

export interface DimensionInfo {
  value: number;
  unit: string;
  type: 'length' | 'width' | 'height' | 'area';
  location: BoundingBox;
}

export interface AnnotationInfo {
  text: string;
  type: 'label' | 'note' | 'specification' | 'reference';
  location: BoundingBox;
}

export interface StructuralElement {
  type: 'column' | 'beam' | 'wall' | 'slab' | 'foundation';
  id?: string;
  size?: string;
  material?: string;
  location: BoundingBox;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PhotoDefectAnalysisResult {
  defects: DetectedDefect[];
  overallCondition: 'good' | 'fair' | 'poor' | 'critical';
  recommendations: string[];
  confidence: number;
  summary: string;
}

export interface DetectedDefect {
  type: 'crack' | 'spalling' | 'corrosion' | 'leakage' | 'deformation' | 'deterioration' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: BoundingBox;
  description: string;
  suggestedAction: string;
  confidence: number;
}

export interface DocumentExtractionResult {
  documentType: 'report' | 'specification' | 'calculation' | 'standard' | 'drawing' | 'other';
  title?: string;
  date?: string;
  author?: string;
  extractedText: string;
  keyFindings: string[];
  tables: TableData[];
  summary: string;
  metadata: Record<string, any>;
}

export interface TableData {
  headers: string[];
  rows: string[][];
  caption?: string;
}

export interface VisionAnalysisOptions {
  language?: 'zh' | 'en' | 'auto';
  detail?: 'low' | 'high' | 'auto';
  includeOCR?: boolean;
  extractTables?: boolean;
  detectDefects?: boolean;
}
