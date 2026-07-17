export type RegulationFactPriority = "critical" | "high" | "medium" | "normal";

export interface RegulationFact {
  id: string;
  codeRef: string;
  section?: string;
  requirement: string;
  requirementZh?: string;
  applicability: string;
  priority: RegulationFactPriority;
  remediationHint?: string;
  sourceQuote?: string;
}

export type ProjectBriefField =
  | "program"
  | "objective"
  | "constraint"
  | "milestone"
  | "metric"
  | "stakeholder"
  | "budget"
  | "schedule"
  | "other";

export interface ProjectBriefFact {
  id: string;
  field: ProjectBriefField;
  label: string;
  value: string;
  sourceQuote?: string;
}

export type DocumentStructuredExtract =
  | {
      kind: "regulations";
      summary: string;
      facts: RegulationFact[];
      modelName: string;
      confidence: number;
    }
  | {
      kind: "project_brief";
      summary: string;
      facts: ProjectBriefFact[];
      modelName: string;
      confidence: number;
    };

export interface StoredDocumentExtract {
  version: 1;
  rawTextPreview?: string;
  structured?: DocumentStructuredExtract;
}

export const STRUCTURED_EXTRACT_CATEGORIES = [
  "regulations",
  "project_brief",
] as const;

export type StructuredExtractCategory = (typeof STRUCTURED_EXTRACT_CATEGORIES)[number];

export function isStructuredExtractCategory(
  category: string
): category is StructuredExtractCategory {
  return (STRUCTURED_EXTRACT_CATEGORIES as readonly string[]).includes(category);
}
