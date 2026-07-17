import type { DiagnosisItem } from "@/types";
import type { SourceEvidence } from "@/types/ai";

const EVIDENCE_TAG = /\[evidence:([^\]]+)\]/g;
const DOC_TAG = /\[doc:([^\]]+)\]/g;

export function parseEvidenceTags(text: string | null | undefined): string[] {
  if (!text) return [];
  return [...text.matchAll(EVIDENCE_TAG)].map((m) => m[1].trim()).filter(Boolean);
}

export function parseDocTags(text: string | null | undefined): string[] {
  if (!text) return [];
  return [...text.matchAll(DOC_TAG)].map((m) => m[1].trim()).filter(Boolean);
}

export function stripEvidenceTags(text: string | null | undefined): string {
  if (!text) return "";
  return text.replace(/\s*\[(evidence|doc):[^\]]+\]/g, "").replace(/\s·\s$/g, "").trim();
}

export function formatEvidenceTag(evidenceId: string): string {
  return `[evidence:${evidenceId}]`;
}

export function formatDocTag(documentName: string): string {
  return `[doc:${documentName}]`;
}

export function resolveEvidenceForDiagnosis(
  item: Pick<DiagnosisItem, "evidence" | "linkedEvidenceIds">,
  allEvidence: SourceEvidence[]
): SourceEvidence[] {
  const ids = new Set<string>();
  for (const id of item.linkedEvidenceIds ?? []) ids.add(id);
  for (const id of parseEvidenceTags(item.evidence)) ids.add(id);

  if (ids.size > 0) {
    const linked = allEvidence.filter((ev) => ids.has(ev.id));
    if (linked.length > 0) return linked;
  }

  const needle = item.evidence?.toLowerCase() ?? "";
  if (!needle) return [];

  return allEvidence.filter((ev) => {
    const quote = ev.quote?.toLowerCase() ?? "";
    const labelText = ev.locationLabel?.toLowerCase() ?? "";
    return (
      (quote && needle.includes(quote.slice(0, 24))) ||
      (labelText && needle.includes(labelText)) ||
      (ev.documentId && needle.includes(ev.documentId))
    );
  });
}
