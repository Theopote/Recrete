import type { DiagnosisCategory, DiagnosisItem, DocumentAsset } from "@/types";
import type { SourceEvidence } from "@/types/ai";
import {
  formatDocTag,
  formatEvidenceTag,
  stripEvidenceTags,
} from "@/lib/documents/evidence-tags";

export interface DiagnosisEvidenceLinks {
  evidenceIds: string[];
  documentIds: string[];
}

const CATEGORY_DOC_AFFINITY: Partial<Record<DiagnosisCategory, string[]>> = {
  structure: ["structure_documents", "old_drawings", "reports"],
  facade: ["survey_photos", "reports", "old_drawings"],
  mep: ["mep_documents", "reports"],
  fire_safety: ["regulations", "reports", "structure_documents"],
  accessibility: ["regulations", "reports", "survey_photos"],
  energy: ["reports", "mep_documents"],
  heritage: ["historical_documents", "old_drawings", "regulations"],
  architecture: ["project_brief", "old_drawings", "survey_photos"],
  operation: ["project_brief", "meeting_records", "reports"],
};

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((w) => w.length > 3)
  );
}

function overlapScore(a: string, b: string): number {
  if (!a.trim() || !b.trim()) return 0;
  const ta = tokenize(a);
  const tb = tokenize(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let overlap = 0;
  for (const token of ta) {
    if (tb.has(token)) overlap += 1;
  }
  return overlap;
}

function documentCategoryBoost(
  category: DiagnosisCategory,
  documentId: string | null | undefined,
  documents: DocumentAsset[]
): number {
  if (!documentId) return 0;
  const doc = documents.find((d) => d.id === documentId);
  if (!doc) return 0;
  const affinity = CATEGORY_DOC_AFFINITY[category] ?? [];
  return affinity.includes(doc.category) ? 2 : 0;
}

export function linkDiagnosisToEvidence(
  item: Pick<DiagnosisItem, "title" | "description" | "evidence" | "category">,
  evidence: SourceEvidence[],
  documents: DocumentAsset[] = [],
  options?: { maxLinks?: number }
): DiagnosisEvidenceLinks {
  const maxLinks = options?.maxLinks ?? 3;
  const haystack = [item.title, item.description, stripEvidenceTags(item.evidence)].join(" ");

  const scored = evidence
    .map((ev) => {
      let score = overlapScore(haystack, ev.quote ?? "") * 3;
      score += overlapScore(haystack, ev.locationLabel ?? "") * 2;
      score += overlapScore(item.title, ev.quote ?? "");
      score += documentCategoryBoost(item.category, ev.documentId, documents);
      score += ev.confidence * 0.5;
      return { ev, score };
    })
    .filter((row) => row.score > 0.5)
    .sort((a, b) => b.score - a.score);

  const top = scored.slice(0, maxLinks);
  const documentIds = [
    ...new Set(top.map((row) => row.ev.documentId).filter(Boolean) as string[]),
  ];

  return {
    evidenceIds: top.map((row) => row.ev.id),
    documentIds,
  };
}

export function enrichDiagnosisEvidenceText(
  item: Pick<DiagnosisItem, "evidence">,
  links: DiagnosisEvidenceLinks,
  evidence: SourceEvidence[],
  documentNames: Record<string, string>
): { evidence: string; linkedEvidenceIds: string[] } {
  const existing = stripEvidenceTags(item.evidence);
  if (links.evidenceIds.length === 0) {
    return { evidence: existing || item.evidence || "", linkedEvidenceIds: [] };
  }

  if (/\[evidence:/.test(item.evidence ?? "")) {
    return {
      evidence: item.evidence ?? "",
      linkedEvidenceIds: links.evidenceIds,
    };
  }

  const snippets: string[] = [];
  if (existing.trim()) snippets.push(existing.trim());

  for (const id of links.evidenceIds) {
    const ev = evidence.find((e) => e.id === id);
    if (!ev) continue;
    const docName = ev.documentId ? documentNames[ev.documentId] : undefined;
    const quote = (ev.quote ?? ev.locationLabel ?? "Document finding").slice(0, 140);
    const tags = [
      docName ? formatDocTag(docName) : null,
      formatEvidenceTag(id),
    ]
      .filter(Boolean)
      .join(" ");
    snippets.push(`${quote} ${tags}`.trim());
  }

  return {
    evidence: snippets.join(" · "),
    linkedEvidenceIds: links.evidenceIds,
  };
}

export function enrichDiagnosisItemsWithEvidence(
  items: DiagnosisItem[],
  evidence: SourceEvidence[],
  documents: DocumentAsset[]
): Array<{ id: string; evidence: string; linkedEvidenceIds: string[] }> {
  const documentNames = Object.fromEntries(documents.map((d) => [d.id, d.name]));

  return items.map((item) => {
    const links = linkDiagnosisToEvidence(item, evidence, documents);
    const enriched = enrichDiagnosisEvidenceText(item, links, evidence, documentNames);
    return { id: item.id, ...enriched };
  });
}
