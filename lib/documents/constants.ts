import type { DocumentCategory, DocumentProjectPhase } from "@/types";

export const DOCUMENT_CATEGORIES = [
  "old_drawings",
  "survey_photos",
  "structure_documents",
  "mep_documents",
  "historical_documents",
  "cost_documents",
  "meeting_records",
  "reports",
  "regulations",
  "project_brief",
  "scanned_archive",
  "others",
] as const satisfies readonly DocumentCategory[];

export const DOCUMENT_PROJECT_PHASES = [
  "survey",
  "diagnosis",
  "strategy",
  "design",
  "construction",
  "general",
] as const satisfies readonly DocumentProjectPhase[];

export function isDocumentCategory(value: string): value is DocumentCategory {
  return (DOCUMENT_CATEGORIES as readonly string[]).includes(value);
}

export function isDocumentProjectPhase(value: string): value is DocumentProjectPhase {
  return (DOCUMENT_PROJECT_PHASES as readonly string[]).includes(value);
}
