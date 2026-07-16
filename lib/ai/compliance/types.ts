import type { ProjectWithRelations } from "@/types";
import type { BuildingCode } from "@/lib/ai/knowledge/code-database";
import type { BilingualString } from "@/lib/i18n/bilingual";

export type ComplianceCategory =
  | "fire"
  | "structure"
  | "accessibility"
  | "energy"
  | "heritage"
  | "general";

export type ComplianceStatus =
  | "compliant"
  | "non_compliant"
  | "requires_verification"
  | "not_applicable";

export type CompliancePriority = "critical" | "high" | "medium" | "normal";

export type OverallCompliance = "compliant" | "partial" | "non_compliant";

export interface ComplianceMeasurements {
  ceilingHeight?: number;
  stairWidth?: number;
  fireCompartmentArea?: number;
  hasAccessibleEntrance?: boolean;
  windowUValue?: number;
  carbonationDepth?: number;
  coverThickness?: number;
  existingLoadKN?: number;
  targetLoadKN?: number;
  travelDistance?: number;
  hasSprinkler?: boolean;
}

export interface ComplianceContext {
  project: ProjectWithRelations;
  measurements: ComplianceMeasurements;
  scenarios: string[];
  climateZone: string;
  applicableCodes: BuildingCode[];
}

export interface ComplianceRuleDefinition {
  id: string;
  codeId: string;
  codeRef: string;
  section: string;
  category: ComplianceCategory;
  requirement: string;
  requirementZh: string;
  priority: CompliancePriority;
  scenarios: string[];
  /** Return false to skip rule for this context */
  applies?: (ctx: ComplianceContext) => boolean;
  evaluate: (ctx: ComplianceContext) => ComplianceCheckResult;
}

export interface ComplianceCheckResult {
  status: ComplianceStatus;
  actualValue?: string;
  requiredValue: string;
  note: string;
  noteZh?: string;
  remediation?: BilingualString;
}

export interface ComplianceCheck {
  ruleId: string;
  category: ComplianceCategory;
  code: string;
  codeId: string;
  section: string;
  requirement: string;
  requirementZh: string;
  status: ComplianceStatus;
  actualValue?: string;
  requiredValue: string;
  note: string;
  noteZh?: string;
  priority: CompliancePriority;
  remediation?: BilingualString;
}

export interface ComplianceEngineReport {
  engineVersion: string;
  evaluatedAt: string;
  overallCompliance: OverallCompliance;
  scenarios: string[];
  climateZone: string;
  applicableCodes: BuildingCode[];
  checks: ComplianceCheck[];
  criticalIssues: BilingualString[];
  recommendations: BilingualString[];
  summary: {
    total: number;
    compliant: number;
    nonCompliant: number;
    requiresVerification: number;
    byCategory: Record<ComplianceCategory, number>;
  };
  measurementCoverage: import("./measurements").MeasurementCoverage;
}

export interface ComplianceEngineOptions {
  measurements?: ComplianceMeasurements;
  includeNotApplicable?: boolean;
}
