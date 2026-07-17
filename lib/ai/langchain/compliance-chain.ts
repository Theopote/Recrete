import "server-only";

import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import type { DiagnosisItem, ProjectWithRelations } from "@/types";
import type { KnowledgeSearchResult } from "../knowledge/embedding-search";
import { extractJsonArray } from "./pipeline-utils";
import { isLangChainEnabled, getChatModel } from "./chains";
import { buildProfessionalPromptContext } from "../knowledge/prompt-context";

interface ComplianceCheckSummary {
  requirement: string;
  code: string;
  status: string;
  note: string;
  priority: string;
}

export async function runComplianceHybridChain(input: {
  project: ProjectWithRelations;
  ruleChecks: ComplianceCheckSummary[];
  knowledge: KnowledgeSearchResult[];
  codeSnippets: string;
  structuredRegulations?: string;
}): Promise<
  Omit<DiagnosisItem, "id" | "projectId" | "createdAt" | "updatedAt">[]
> {
  if (!isLangChainEnabled() || input.ruleChecks.length === 0) {
    return [];
  }

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are Recrete's compliance reviewer for Chinese building codes (GB standards).
Given rule-engine findings and knowledge snippets, add 0–3 NEW diagnosis items that the rules may have missed.
When structured regulation extracts from uploaded code documents are provided, prioritize gaps those clauses highlight for the occupancy change.
Return JSON array only: [{ title, category, severity, status, description, evidence, recommendation, relatedLocation }].
Do not duplicate existing rule findings. categories: fire_safety, accessibility, structure, architecture, operation.`,
    ],
    [
      "human",
      `{professionalContext}

Project function change: {originalFunction} → {targetFunction}
Location: {location}

Rule engine findings:
{ruleChecks}

Code snippets:
{codes}

Structured regulation extracts (uploaded code documents):
{structuredRegulations}

RAG knowledge:
{knowledge}`,
    ],
  ]);

  const chain = RunnableSequence.from([
    prompt,
    getChatModel("compliance"),
    new StringOutputParser(),
  ]);

  const content = await chain.invoke({
    professionalContext: buildProfessionalPromptContext(input.project),
    originalFunction: input.project.originalFunction,
    targetFunction: input.project.targetFunction,
    location: input.project.location,
    ruleChecks: input.ruleChecks
      .map((c) => `- [${c.status}] ${c.code}: ${c.requirement} — ${c.note}`)
      .join("\n"),
    codes: input.codeSnippets || "None",
    structuredRegulations: input.structuredRegulations?.trim() || "None",
    knowledge:
      input.knowledge.map((k) => `[${k.sourceType}] ${k.title}: ${k.excerpt}`).join("\n") ||
      "None",
  });

  return extractJsonArray<
    Omit<DiagnosisItem, "id" | "projectId" | "createdAt" | "updatedAt">
  >(content) ?? [];
}
