export type ElevatorFeasibilityVerdict =
  | "feasible"
  | "conditional"
  | "infeasible"
  | "insufficient_data";

export interface ElevatorSpaceCheck {
  candidateRoomId?: string;
  candidateLabel?: string;
  width?: number;
  depth?: number;
  meetsMinimum: boolean;
  note: string;
}

export interface ElevatorStructuralCheck {
  compliant: boolean | "unknown";
  note: string;
}

export interface ElevatorComplianceCheckItem {
  ruleId: string;
  status: string;
  note: string;
}

export interface ElevatorHeritageFlag {
  requiresApproval: boolean;
  note: string;
}

export interface ElevatorFeasibilityResult {
  verdict: ElevatorFeasibilityVerdict;
  spaceCheck: ElevatorSpaceCheck;
  structuralCheck: ElevatorStructuralCheck;
  complianceChecks: ElevatorComplianceCheckItem[];
  heritageFlag?: ElevatorHeritageFlag;
  aiRecommendation?: string;
  generatedAt: string;
}
