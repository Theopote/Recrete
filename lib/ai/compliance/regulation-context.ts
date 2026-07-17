import type { DocumentAsset, ProjectWithRelations } from "@/types";
import type { RegulationFact } from "@/types/document-facts";
import { parseStoredDocumentExtract } from "@/lib/documents/structured-extract-storage";
import { formatDocTag } from "@/lib/documents/evidence-tags";
import { formatWebSearchSnippets, type WebSearchResult } from "@/lib/ai/knowledge/web-search";
import type { ComplianceCategory, ComplianceCheck } from "./types";

export interface RegulationFactWithSource extends RegulationFact {
  documentId: string;
  documentName: string;
}

const CATEGORY_KEYWORDS: Partial<Record<ComplianceCategory, RegExp>> = {
  fire: /fire|防火|疏散|egress|compartment|smoke|喷淋|消防/i,
  accessibility: /access|无障碍|barrier|ramp|elevator|坡道|电梯/i,
  structure: /structure|结构|荷载|load|seismic|抗震/i,
  energy: /energy|节能|thermal|保温|envelope/i,
  heritage: /heritage|文保|historic|保护/i,
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
  const ta = tokenize(a);
  const tb = tokenize(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let overlap = 0;
  for (const token of ta) {
    if (tb.has(token)) overlap += 1;
  }
  return overlap;
}

function normalizeCodeRef(code: string): string {
  return code.replace(/\s+/g, "").replace(/-/g, "").toLowerCase();
}

function codeRefMatches(checkCode: string, factCodeRef: string): boolean {
  const a = normalizeCodeRef(checkCode);
  const b = normalizeCodeRef(factCodeRef);
  if (!a || !b) return false;
  return b.includes(a) || a.includes(b);
}

export function collectStructuredRegulationFacts(
  documents: DocumentAsset[] = []
): RegulationFactWithSource[] {
  const facts: RegulationFactWithSource[] = [];

  for (const doc of documents) {
    if (doc.isCurrentVersion === false) continue;
    if (doc.category !== "regulations") continue;

    const stored = parseStoredDocumentExtract(doc.extractedText);
    if (stored?.structured?.kind !== "regulations") continue;

    for (const fact of stored.structured.facts) {
      facts.push({
        ...fact,
        documentId: doc.id,
        documentName: doc.name,
      });
    }
  }

  return facts;
}

export function scoreRegulationFactForCheck(
  fact: RegulationFactWithSource,
  check: Pick<ComplianceCheck, "code" | "section" | "requirement" | "requirementZh" | "category">
): number {
  let score = 0;

  if (codeRefMatches(check.code, fact.codeRef)) score += 4;
  if (fact.section && check.section && fact.section.includes(check.section)) score += 3;

  score += overlapScore(fact.requirement, check.requirement) * 2;
  score += overlapScore(fact.requirement, check.requirementZh ?? "") * 2;

  const keywords = CATEGORY_KEYWORDS[check.category];
  if (keywords?.test(fact.requirement)) score += 1.5;

  if (fact.priority === "critical") score += 0.5;
  else if (fact.priority === "high") score += 0.25;

  return score;
}

export function findRegulationFactsForCheck(
  check: Pick<ComplianceCheck, "code" | "section" | "requirement" | "requirementZh" | "category">,
  facts: RegulationFactWithSource[],
  max = 2
): RegulationFactWithSource[] {
  return facts
    .map((fact) => ({ fact, score: scoreRegulationFactForCheck(fact, check) }))
    .filter((row) => row.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((row) => row.fact);
}

export function enrichComplianceEvidenceWithRegulations(
  baseEvidence: string,
  check: Pick<ComplianceCheck, "code" | "section" | "requirement" | "requirementZh" | "category">,
  facts: RegulationFactWithSource[],
  webResults?: WebSearchResult[]
): string {
  const relevant = findRegulationFactsForCheck(check, facts);
  const parts = [baseEvidence];

  if (relevant.length > 0) {
    const snippets = relevant.map((fact) => {
      const section = fact.section ? ` ${fact.section}` : "";
      const quote = (fact.sourceQuote ?? fact.requirement).slice(0, 120);
      return `${fact.codeRef}${section}: ${quote} ${formatDocTag(fact.documentName)}`.trim();
    });
    parts.push(...snippets);
  }

  if (webResults?.length) {
    parts.push(
      formatWebSearchSnippets(webResults, {
        prefix: "联网检索（需核实官方文本）",
        maxItems: 2,
      })
    );
  }

  return parts.filter(Boolean).join(" · ");
}

export function formatStructuredRegulationsBlock(
  facts: RegulationFactWithSource[],
  webRegulationBlock?: string
): string {
  if (facts.length === 0) {
    const webNote = webRegulationBlock
      ? `\n\n${webRegulationBlock}`
      : "\n\nNo uploaded regulation documents matched. Configure web search API keys on the server to enable live code lookup.";
    return `## Structured Regulation Extracts\nNo structured regulation clauses extracted from uploaded code documents yet.${webNote}`;
  }

  const lines = facts.slice(0, 12).map((fact, i) => {
    const section = fact.section ? ` ${fact.section}` : "";
    const req = fact.requirementZh ?? fact.requirement;
    const hint = fact.remediationHint ? ` Remediation: ${fact.remediationHint.slice(0, 100)}` : "";
    return `${i + 1}. **[${fact.documentName} / ${fact.codeRef}${section}]** (${fact.priority}) ${req.slice(0, 200)}${hint}`;
  });

  return `## Structured Regulation Extracts (${facts.length} clause(s) from uploaded code documents)
PRIORITY: Ground compliance diagnosis and evidence in these extracted clauses when they relate to rule-engine findings or occupancy change risks.

${lines.join("\n")}`;
}

export function formatStructuredRegulationsForComplianceChain(
  facts: RegulationFactWithSource[]
): string {
  if (facts.length === 0) return "None";
  return facts
    .slice(0, 10)
    .map(
      (f) =>
        `- [${f.documentName}] ${f.codeRef}${f.section ? ` ${f.section}` : ""} (${f.priority}): ${(f.requirementZh ?? f.requirement).slice(0, 160)}`
    )
    .join("\n");
}

export function loadStructuredRegulationContext(project: ProjectWithRelations): {
  facts: RegulationFactWithSource[];
  promptBlock: string;
  chainSnippets: string;
} {
  const facts = collectStructuredRegulationFacts(project.documents);
  return {
    facts,
    promptBlock: formatStructuredRegulationsBlock(facts),
    chainSnippets: formatStructuredRegulationsForComplianceChain(facts),
  };
}

