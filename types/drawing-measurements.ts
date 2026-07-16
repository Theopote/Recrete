import type { ComplianceMeasurements } from "@/lib/ai/compliance/types";
import type { ComplianceMeasurementKey } from "@/lib/ai/compliance/measurements";

export interface DrawingMeasurementProvenance {
  field: ComplianceMeasurementKey;
  value: number | boolean;
  confidence: number;
  source: string;
  method: string;
}

export interface DrawingMeasurementExtraction {
  measurements: ComplianceMeasurements;
  provenance: DrawingMeasurementProvenance[];
  drawingCount: number;
}
