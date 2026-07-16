import type { ComplianceMeasurements } from "@/lib/ai/compliance/types";
import type { MeasurementCompleteness } from "@/lib/ai/compliance/measurements";

export interface ProjectSiteMeasurementsDto {
  projectId: string;
  measurements: ComplianceMeasurements;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  completeness: MeasurementCompleteness;
}

export interface UpdateProjectSiteMeasurementsInput {
  measurements?: ComplianceMeasurements;
  notes?: string | null;
}
