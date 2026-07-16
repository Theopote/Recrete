import type {
  ComplianceEngineReport,
  ComplianceMeasurements,
  OverallCompliance,
} from "@/lib/ai/compliance/types";
import type { BilingualString } from "@/lib/i18n/bilingual";
import type { DiagnosisItem } from "@/types";

export interface ComplianceCheckRecordDto {
  id: string;
  runId: string;
  projectId: string;
  ruleId: string;
  category: string;
  codeRef: string;
  codeId: string;
  section: string;
  requirement: string;
  requirementZh: string;
  status: string;
  actualValue?: string | null;
  requiredValue: string;
  note: string;
  noteZh?: string | null;
  priority: string;
  remediation?: BilingualString | string | null;
}

export interface ComplianceCheckRunDto {
  id: string;
  projectId: string;
  engineVersion: string;
  overallCompliance: OverallCompliance;
  scenarios: string[];
  climateZone: string;
  measurements?: ComplianceMeasurements | null;
  summary: ComplianceEngineReport["summary"];
  criticalIssues: Array<BilingualString | string>;
  recommendations: Array<BilingualString | string>;
  diagnosisApplied: boolean;
  diagnosisCount: number;
  createdAt: Date;
  checks?: ComplianceCheckRecordDto[];
}

export interface SaveComplianceRunInput {
  projectId: string;
  report: ComplianceEngineReport;
  measurements?: ComplianceMeasurements;
}

export interface ApplyComplianceDiagnosisResult {
  created: DiagnosisItem[];
  skipped: number;
  diagnosisCount: number;
}

export interface PersistComplianceResult {
  run: ComplianceCheckRunDto;
  diagnosis?: ApplyComplianceDiagnosisResult;
}
