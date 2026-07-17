import "server-only";

import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import type { DiagnosisItem, ProjectWithRelations } from "@/types";
import type { AIInsight, AITask } from "@/types/ai";
import type { KnowledgeSearchResult } from "../knowledge/embedding-search";
import {
  buildProjectContextBlock,
  extractJsonArray,
  formatDiagnosisForPrompt,
} from "./pipeline-utils";
import { isLangChainEnabled, getChatModel } from "./chains";
import { buildProfessionalPromptContext } from "../knowledge/prompt-context";
import { buildRuleBasedExecutiveSummary } from "../diagnosis-executive-summary";
import { isOpenAIConfigured } from "../openai-config";
import { chatCompletion } from "../openai-client";

export interface DiagnosisInsightDraft {
  title: string;
  type: AIInsight["type"];
  priority: AIInsight["priority"];
  summary: string;
  recommendation: string;
  sourceTitle?: string;
}

export interface DiagnosisTaskDraft {
  title: string;
  description: string;
  category: AITask["category"];
  priority: AITask["priority"];
}

export async function runDiagnosisExecutiveSummaryChain(input: {
  project: ProjectWithRelations;
  diagnosisItems: DiagnosisItem[];
  expertSummary?: string;
  knowledge?: KnowledgeSearchResult[];
}): Promise<string> {
  if (isLangChainEnabled()) {
    const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are Recrete's building diagnosis lead. Write a 150-word executive summary for architects and owners. Bilingual terms OK. Focus on top risks and next steps.

{professionalContext}`,
    ],
    [
      "human",
      `{projectContext}

Expert agent summary: {expertSummary}

Diagnosis items:
{diagnosis}

Reference cases:
{knowledge}`,
    ],
  ]);

    const chain = RunnableSequence.from([prompt, getChatModel("reasoning"), new StringOutputParser()]);

    return chain.invoke({
      professionalContext: buildProfessionalPromptContext(input.project),
      projectContext: buildProjectContextBlock(input.project),
      expertSummary: input.expertSummary ?? "Standard multi-agent diagnosis completed.",
      diagnosis: formatDiagnosisForPrompt(input.diagnosisItems),
      knowledge:
        input.knowledge?.map((k) => `- ${k.title}: ${k.excerpt}`).join("\n") ??
        "No external references.",
    });
  }

  if (isOpenAIConfigured()) {
    const knowledgeBlock =
      input.knowledge?.map((k) => `- ${k.title}: ${k.excerpt}`).join("\n") ??
      "No external references.";

    return chatCompletion(
      [
        {
          role: "system",
          content: `You are Recrete's building diagnosis lead. Write a 150-word executive summary for architects and owners. Bilingual terms OK. Focus on top risks and next steps.

${buildProfessionalPromptContext(input.project)}`,
        },
        {
          role: "user",
          content: `${buildProjectContextBlock(input.project)}

Expert agent summary: ${input.expertSummary ?? "Standard multi-agent diagnosis completed."}

Diagnosis items:
${formatDiagnosisForPrompt(input.diagnosisItems)}

Reference cases:
${knowledgeBlock}`,
        },
      ],
      { scenario: "reasoning", maxTokens: 450, temperature: 0.35 }
    );
  }

  return buildRuleBasedExecutiveSummary(input);
}

export async function runDiagnosisInsightsChain(input: {
  project: ProjectWithRelations;
  diagnosisItems: DiagnosisItem[];
}): Promise<DiagnosisInsightDraft[]> {
  const ruleBased = input.diagnosisItems
    .filter((d) => d.severity === "high" || d.severity === "critical")
    .map((d) => ({
      title: d.title,
      type: (d.category === "fire_safety" ? "compliance_warning" : "risk") as AIInsight["type"],
      priority: (d.severity === "critical" ? "critical" : "high") as AIInsight["priority"],
      summary: d.description.slice(0, 200),
      recommendation: d.recommendation ?? "Review with design team.",
      sourceTitle: d.title,
    }));

  if (!isLangChainEnabled() || ruleBased.length === 0) {
    return ruleBased;
  }

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `Synthesize diagnosis into actionable AI insights. Return ONLY a JSON array (max 8 items):
[{"title":"...","type":"risk|compliance_warning|design_strategy|cost|schedule","priority":"critical|high|medium|low","summary":"...","recommendation":"..."}]`,
    ],
    [
      "human",
      `Project: {projectName}
Target function: {targetFunction}

Diagnosis:
{diagnosis}`,
    ],
  ]);

  const chain = RunnableSequence.from([prompt, getChatModel("reasoning"), new StringOutputParser()]);
  const raw = await chain.invoke({
    projectName: input.project.name,
    targetFunction: input.project.targetFunction,
    diagnosis: formatDiagnosisForPrompt(input.diagnosisItems),
  });

  const parsed = extractJsonArray<DiagnosisInsightDraft>(raw);
  if (!parsed || parsed.length === 0) return ruleBased;

  return parsed.slice(0, 8).map((item) => ({
    title: item.title ?? "Diagnosis insight",
    type: item.type ?? "risk",
    priority: item.priority ?? "medium",
    summary: item.summary ?? "",
    recommendation: item.recommendation ?? "Review with design team.",
  }));
}

export async function runDiagnosisTasksChain(input: {
  project: ProjectWithRelations;
  diagnosisItems: DiagnosisItem[];
  insightsSummary?: string;
}): Promise<DiagnosisTaskDraft[]> {
  const ruleBased = input.diagnosisItems
    .filter((d) => d.requiresEngineerReview || d.severity === "critical")
    .slice(0, 6)
    .map((d) => ({
      title: `Engineer review: ${d.title}`,
      description: d.recommendation ?? d.description,
      category: (d.category === "structure"
        ? "structure"
        : d.category === "mep"
          ? "mep"
          : "compliance") as AITask["category"],
      priority: (d.severity === "critical" ? "critical" : "high") as AITask["priority"],
    }));

  if (!isLangChainEnabled()) return ruleBased;

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `Generate follow-up tasks from building diagnosis. Return ONLY JSON array (max 6):
[{"title":"...","description":"...","category":"structure|mep|compliance|survey|design|documentation|other","priority":"critical|high|medium|low"}]`,
    ],
    [
      "human",
      `Project: {projectName}
Insights: {insights}

Diagnosis requiring action:
{diagnosis}`,
    ],
  ]);

  const chain = RunnableSequence.from([prompt, getChatModel("reasoning"), new StringOutputParser()]);
  const raw = await chain.invoke({
    projectName: input.project.name,
    insights: input.insightsSummary ?? "See diagnosis list.",
    diagnosis: formatDiagnosisForPrompt(
      input.diagnosisItems.filter(
        (d) => d.requiresEngineerReview || d.severity !== "low"
      )
    ),
  });

  const parsed = extractJsonArray<DiagnosisTaskDraft>(raw);
  if (!parsed || parsed.length === 0) return ruleBased;

  return parsed.slice(0, 6).map((t) => ({
    title: t.title ?? "Follow-up task",
    description: t.description ?? "",
    category: t.category ?? "other",
    priority: t.priority ?? "medium",
  }));
}
