export type CostRecordOutcome = "success" | "partial" | "failure";

export interface ProjectCostRecord {
  id: string;
  projectId: string;
  strategyType?: string | null;
  actualCostPerSqm: number;
  actualTotalCost: number;
  durationMonths?: number | null;
  outcome: CostRecordOutcome;
  notes?: string | null;
  region: string;
  city?: string | null;
  buildingType: string;
  grossFloorArea: number;
  recordedAt: Date;
  createdAt: Date;
}

export interface ProjectCostRecordWithProject extends ProjectCostRecord {
  projectName?: string;
  projectCode?: string;
  projectLocation?: string;
}

export interface BenchmarkCalibrationResult {
  updatedCount: number;
  benchmarks: Array<{
    id: string;
    region: string;
    buildingType: string;
    strategyType: string;
    costPerSqmMin: number;
    costPerSqmMax: number;
    costPerSqmAvg: number;
    sampleSize: number;
  }>;
}
