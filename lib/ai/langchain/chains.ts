import "server-only";

import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import type { ProjectWithRelations } from "@/types";
import type { StrategyLabParams } from "@/types/ai";
import type { KnowledgeSearchResult } from "../knowledge/embedding-search";

export function isLangChainEnabled(): boolean {
  return (
    process.env.LANGCHAIN_ENABLED === "true" &&
    Boolean(process.env.OPENAI_API_KEY)
  );
}

function getChatModel() {
  return new ChatOpenAI({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: 0.4,
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function runStrategyContextChain(input: {
  project: ProjectWithRelations;
  params: StrategyLabParams;
  knowledge: KnowledgeSearchResult[];
  diagnosisSummary: string;
}): Promise<string> {
  if (!isLangChainEnabled()) {
    return input.knowledge.map((k) => `- ${k.title}: ${k.excerpt}`).join("\n");
  }

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are Recrete's renovation strategy analyst. Synthesize project constraints and knowledge snippets into a concise strategy brief (max 400 words, bilingual terms OK).`,
    ],
    [
      "human",
      `Project: {projectName}
Location: {location}
Target function: {targetFunction}
Floor area: {area} m²
Budget: {budget}
Design ambition: {ambition}
Preservation: {preservation}

Diagnosis summary:
{diagnosis}

Reference knowledge:
{knowledge}`,
    ],
  ]);

  const chain = RunnableSequence.from([
    prompt,
    getChatModel(),
    new StringOutputParser(),
  ]);

  return chain.invoke({
    projectName: input.project.name,
    location: input.project.location,
    targetFunction: input.params.targetFunction,
    area: String(input.params.grossFloorArea ?? input.project.grossFloorArea),
    budget: input.params.budgetLevel,
    ambition: input.params.designAmbition,
    preservation: input.params.preservationLevel,
    diagnosis: input.diagnosisSummary || "No critical diagnosis items.",
    knowledge:
      input.knowledge.map((k) => `[${k.sourceType}] ${k.title}: ${k.excerpt}`).join("\n") ||
      "No external references.",
  });
}

export async function runDocumentSummaryChain(input: {
  title: string;
  extractedText: string;
  category?: string;
}): Promise<string> {
  const text = input.extractedText.slice(0, 12000);
  if (!isLangChainEnabled()) {
    return text.slice(0, 500) || `Document ${input.title} processed.`;
  }

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "Summarize building/renovation documents for architects. Output bullet points: key findings, risks, recommended actions.",
    ],
    [
      "human",
      "Document: {title}\nCategory: {category}\n\nContent:\n{text}",
    ],
  ]);

  const chain = RunnableSequence.from([
    prompt,
    getChatModel(),
    new StringOutputParser(),
  ]);

  return chain.invoke({
    title: input.title,
    category: input.category ?? "general",
    text,
  });
}

export async function runSpatialPlanningChain(input: {
  targetFunction: string;
  layoutSummary: string;
  flowSummary: string;
}): Promise<string> {
  if (!isLangChainEnabled()) {
    return `Layout and flow analysis complete for ${input.targetFunction}.`;
  }

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "You are a spatial planning consultant for adaptive reuse projects."],
    [
      "human",
      `Target function: {targetFunction}

Layout optimization:
{layout}

Flow simulation:
{flow}

Provide 3 actionable spatial planning recommendations.`,
    ],
  ]);

  const chain = RunnableSequence.from([
    prompt,
    getChatModel(),
    new StringOutputParser(),
  ]);

  return chain.invoke({
    targetFunction: input.targetFunction,
    layout: input.layoutSummary,
    flow: input.flowSummary,
  });
}

/** Generic LangChain workflow step runner for future multi-agent pipelines. */
export function createWorkflowChain<T extends Record<string, unknown>>(
  systemPrompt: string,
  humanTemplate: string
) {
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", systemPrompt],
    MessagesPlaceholder.optional("history"),
    ["human", humanTemplate],
  ]);

  return RunnableSequence.from([prompt, getChatModel(), new StringOutputParser()]);
}
