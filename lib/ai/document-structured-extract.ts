import "server-only";

import type { DocumentAsset } from "@/types";
import type {
  DocumentStructuredExtract,
  ProjectBriefFact,
  ProjectBriefField,
  RegulationFact,
  RegulationFactPriority,
  StructuredExtractCategory,
} from "@/types/document-facts";
import { isStructuredExtractCategory } from "@/types/document-facts";
import { isOpenAIConfigured } from "@/lib/ai/openai-config";
import { chatJsonObject } from "@/lib/ai/openai-client";
import type { SourceEvidence } from "@/types/ai";
import {
  wrapExtractedText,
  parseStoredDocumentExtract,
  structuredSummaryForDisplay,
} from "@/lib/documents/structured-extract-storage";

export {
  wrapExtractedText,
  parseStoredDocumentExtract,
  structuredSummaryForDisplay,
};

export interface StructuredExtractContext {
  projectName?: string;
  targetFunction?: string;
  location?: string;
  renovationGoal?: string;
}

const GB_CODE = /\b(GB\s*\/?\s*T?\s*\d{4,5}[-—]?\d{0,4}|JGJ\s*\d{1,3}[-—]?\d{0,4}|建标\s*\d+|DB\s*\d+)/gi;
const SECTION = /第\s*[\d.]+(?:\.\d+)*\s*条/g;
const MUST_PATTERN = /(应|不得|必须|不应|严禁|宜)[^。；;\n]{8,120}/g;

const BRIEF_PATTERNS: Array<{ field: ProjectBriefField; pattern: RegExp; label: string }> = [
  { field: "objective", pattern: /(?:建设目标|设计目标|项目目标)[：:]\s*(.+)/i, label: "Project objective" },
  { field: "program", pattern: /(?:功能定位|主要功能|建设内容)[：:]\s*(.+)/i, label: "Program" },
  { field: "metric", pattern: /(?:总建筑面积|GFA|面积)[：:]\s*([\d,.]+\s*(?:㎡|m2|sqm)?)/i, label: "Gross floor area" },
  { field: "schedule", pattern: /(?:工期|建设周期|完成时间)[：:]\s*(.+)/i, label: "Schedule" },
  { field: "budget", pattern: /(?:投资|预算|造价)[：:]\s*(.+)/i, label: "Budget" },
  { field: "constraint", pattern: /(?:约束|限制条件|设计要求)[：:]\s*(.+)/i, label: "Design constraint" },
  { field: "milestone", pattern: /(?:里程碑|阶段目标)[：:]\s*(.+)/i, label: "Milestone" },
];

function factId(prefix: string, index: number): string {
  return `${prefix}-${index + 1}`;
}

function inferCodeRef(text: string, filename: string): string {
  const fromText = text.match(GB_CODE)?.[0];
  if (fromText) return fromText.replace(/\s+/g, " ").trim();
  const fromName = filename.match(GB_CODE)?.[0];
  if (fromName) return fromName.replace(/\s+/g, " ").trim();
  if (/fire|防火/i.test(filename)) return "GB 50016 (fire)";
  if (/无障碍|accessibility/i.test(filename)) return "GB 50763 (accessibility)";
  return "Applicable building code";
}

function priorityFromRequirement(text: string): RegulationFactPriority {
  if (/严禁|不得|必须|critical/i.test(text)) return "critical";
  if (/应|不应|须|high/i.test(text)) return "high";
  if (/宜|建议|medium/i.test(text)) return "medium";
  return "normal";
}

export function extractRegulationFactsRuleBased(
  text: string,
  doc: DocumentAsset,
  ctx: StructuredExtractContext = {}
): DocumentStructuredExtract {
  const codeRef = inferCodeRef(text, doc.name);
  const facts: RegulationFact[] = [];
  const seen = new Set<string>();

  const mustMatches = text.match(MUST_PATTERN) ?? [];
  for (const clause of mustMatches.slice(0, 12)) {
    const key = clause.slice(0, 40);
    if (seen.has(key)) continue;
    seen.add(key);
    facts.push({
      id: factId("reg", facts.length),
      codeRef,
      section: text.match(SECTION)?.[0],
      requirement: clause.trim(),
      applicability: ctx.targetFunction
        ? `Occupancy / use change toward ${ctx.targetFunction}`
        : "Renovation and adaptive reuse",
      priority: priorityFromRequirement(clause),
      remediationHint: "Verify with licensed code consultant before permit submission.",
      sourceQuote: clause.trim().slice(0, 200),
    });
  }

  if (facts.length === 0) {
    const fallbackLines = text
      .split(/\n+/)
      .map((l) => l.trim())
      .filter((l) => l.length > 24 && /规范|标准|防火|疏散|荷载|节能|无障碍|code|egress|fire/i.test(l));

    for (const line of fallbackLines.slice(0, 8)) {
      facts.push({
        id: factId("reg", facts.length),
        codeRef,
        requirement: line.slice(0, 180),
        applicability: doc.description ?? "Project code review",
        priority: priorityFromRequirement(line),
        sourceQuote: line.slice(0, 200),
      });
    }
  }

  if (facts.length === 0 && doc.description) {
    facts.push({
      id: factId("reg", 0),
      codeRef,
      requirement: doc.description,
      applicability: ctx.renovationGoal ?? "Renovation compliance review",
      priority: "medium",
      sourceQuote: doc.description,
    });
  }

  return {
    kind: "regulations",
    summary: `${facts.length} regulatory clause(s) extracted from ${doc.name} (${codeRef}).`,
    facts,
    modelName: "recrete-regulation-rules-v1",
    confidence: facts.length >= 3 ? 0.72 : 0.58,
  };
}

export function extractProjectBriefFactsRuleBased(
  text: string,
  doc: DocumentAsset,
  ctx: StructuredExtractContext = {}
): DocumentStructuredExtract {
  const facts: ProjectBriefFact[] = [];
  const haystack = `${doc.name}\n${doc.description ?? ""}\n${text}`;

  for (const { field, pattern, label } of BRIEF_PATTERNS) {
    const match = haystack.match(pattern);
    if (!match?.[1]) continue;
    facts.push({
      id: factId("brief", facts.length),
      field,
      label,
      value: match[1].trim().slice(0, 240),
      sourceQuote: match[0].slice(0, 200),
    });
  }

  if (ctx.renovationGoal) {
    facts.push({
      id: factId("brief", facts.length),
      field: "objective",
      label: "Renovation goal (project context)",
      value: ctx.renovationGoal,
    });
  }
  if (ctx.targetFunction) {
    facts.push({
      id: factId("brief", facts.length),
      field: "program",
      label: "Target function",
      value: ctx.targetFunction,
    });
  }

  if (facts.length === 0 && doc.description) {
    facts.push({
      id: factId("brief", 0),
      field: "other",
      label: "Brief summary",
      value: doc.description,
      sourceQuote: doc.description,
    });
  }

  return {
    kind: "project_brief",
    summary: `${facts.length} brief field(s) extracted from ${doc.name}.`,
    facts,
    modelName: "recrete-brief-rules-v1",
    confidence: facts.length >= 2 ? 0.7 : 0.55,
  };
}

async function extractWithOpenAI(
  category: StructuredExtractCategory,
  text: string,
  doc: DocumentAsset,
  ctx: StructuredExtractContext
): Promise<DocumentStructuredExtract | null> {
  if (!isOpenAIConfigured()) return null;

  const snippet = text.slice(0, 12000);
  const isReg = category === "regulations";

  const system = isReg
    ? `Extract building code / regulation clauses relevant to renovation. Return JSON:
{"kind":"regulations","summary":"...","facts":[{"codeRef":"GB 50016","section":"5.3.1","requirement":"...","requirementZh":"...","applicability":"...","priority":"critical|high|medium|normal","remediationHint":"...","sourceQuote":"..."}],"confidence":0.85}
Max 10 facts. Bilingual OK.`
    : `Extract owner / design brief requirements. Return JSON:
{"kind":"project_brief","summary":"...","facts":[{"field":"program|objective|constraint|milestone|metric|stakeholder|budget|schedule|other","label":"...","value":"...","sourceQuote":"..."}],"confidence":0.85}
Max 12 facts.`;

  try {
    const parsed = await chatJsonObject<
      DocumentStructuredExtract & { facts?: Array<Record<string, unknown>> }
    >(
      [
        { role: "system", content: system },
        {
          role: "user",
          content: `Project: ${ctx.projectName ?? "Unknown"}
Target function: ${ctx.targetFunction ?? "TBD"}
Location: ${ctx.location ?? "TBD"}
Document: ${doc.name} (${doc.category})
Description: ${doc.description ?? "—"}

Text:
${snippet}`,
        },
      ],
      { scenario: "reasoning", maxTokens: 2200, temperature: 0.2 }
    );

    if (parsed.kind === "regulations" && Array.isArray(parsed.facts)) {
      return {
        kind: "regulations",
        summary: parsed.summary ?? `Regulatory extract — ${doc.name}`,
        facts: parsed.facts.slice(0, 10).map((f, i) => ({
          id: factId("reg", i),
          codeRef: String(f.codeRef ?? inferCodeRef(text, doc.name)),
          section: f.section ? String(f.section) : undefined,
          requirement: String(f.requirement ?? ""),
          requirementZh: f.requirementZh ? String(f.requirementZh) : undefined,
          applicability: String(f.applicability ?? "Renovation project"),
          priority: (f.priority as RegulationFactPriority) ?? "medium",
          remediationHint: f.remediationHint ? String(f.remediationHint) : undefined,
          sourceQuote: f.sourceQuote ? String(f.sourceQuote) : undefined,
        })),
        modelName: "openai-regulation-extract",
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.82,
      };
    }

    if (parsed.kind === "project_brief" && Array.isArray(parsed.facts)) {
      return {
        kind: "project_brief",
        summary: parsed.summary ?? `Brief extract — ${doc.name}`,
        facts: parsed.facts.slice(0, 12).map((f, i) => ({
          id: factId("brief", i),
          field: (f.field as ProjectBriefField) ?? "other",
          label: String(f.label ?? "Requirement"),
          value: String(f.value ?? ""),
          sourceQuote: f.sourceQuote ? String(f.sourceQuote) : undefined,
        })),
        modelName: "openai-brief-extract",
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.8,
      };
    }
  } catch {
    return null;
  }

  return null;
}

export async function runStructuredDocumentExtract(input: {
  category: string;
  text: string;
  document: DocumentAsset;
  context?: StructuredExtractContext;
}): Promise<DocumentStructuredExtract | null> {
  if (!isStructuredExtractCategory(input.category)) return null;

  const ai = await extractWithOpenAI(
    input.category,
    input.text,
    input.document,
    input.context ?? {}
  );
  if (ai && ai.facts.length > 0) return ai;

  if (input.category === "regulations") {
    return extractRegulationFactsRuleBased(input.text, input.document, input.context);
  }
  return extractProjectBriefFactsRuleBased(input.text, input.document, input.context);
}

export function buildStructuredFactEvidence(
  projectId: string,
  documentId: string,
  extract: DocumentStructuredExtract
): Omit<SourceEvidence, "id" | "createdAt">[] {
  if (extract.kind === "regulations") {
    return extract.facts.slice(0, 8).map((fact) => ({
      projectId,
      sourceType: "document",
      sourceId: documentId,
      documentId,
      locationLabel: `${fact.codeRef}${fact.section ? ` §${fact.section}` : ""}`,
      quote: fact.sourceQuote ?? fact.requirement,
      confidence: extract.confidence,
    }));
  }

  return extract.facts.slice(0, 8).map((fact) => ({
    projectId,
    sourceType: "document",
    sourceId: documentId,
    documentId,
    locationLabel: `Brief — ${fact.label}`,
    quote: fact.sourceQuote ?? `${fact.label}: ${fact.value}`,
    confidence: extract.confidence,
  }));
}

export { memoryFactsFromStructuredExtract } from "@/lib/documents/structured-extract-storage";
