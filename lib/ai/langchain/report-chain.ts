import "server-only";

import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import type {
  DiagnosisItem,
  ProjectWithRelations,
  RenovationStrategy,
  SiteIssue,
  ReportType,
} from "@/types";
import type { BuildingMemory } from "@/types/ai";
import {
  buildMemoryContextBlock,
  buildProjectContextBlock,
  formatDiagnosisForPrompt,
  formatIssuesForPrompt,
  formatStrategiesForPrompt,
  langChainModelLabel,
  REPORT_TYPE_GUIDANCE,
} from "./pipeline-utils";
import { isLangChainEnabled, getChatModel } from "./chains";
import { buildProfessionalPromptContext } from "../knowledge/prompt-context";

export { langChainModelLabel };

export async function runReportGenerationChain(input: {
  project: ProjectWithRelations;
  buildingMemory?: BuildingMemory | null;
  diagnosisItems: DiagnosisItem[];
  strategies: RenovationStrategy[];
  issues: SiteIssue[];
  reportType: ReportType;
  skeletonContent: string;
  skeletonTitle: string;
}): Promise<{ title: string; content: string }> {
  if (!isLangChainEnabled()) {
    return { title: input.skeletonTitle, content: input.skeletonContent };
  }

  const guidance = REPORT_TYPE_GUIDANCE[input.reportType];
  const date = new Date().toISOString().split("T")[0];

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are Recrete's technical report writer for adaptive reuse projects.
Write a complete Markdown report in professional tone. Use the skeleton as structure guide but enrich with analysis.
Include tables where helpful. Bilingual section headers OK.
Report type guidance: {guidance}
Date: {date}

{professionalContext}`,
    ],
    [
      "human",
      `{projectContext}

Building memory:
{memory}

Diagnosis ({diagnosisCount} items):
{diagnosis}

Strategies ({strategyCount}):
{strategies}

Site issues:
{issues}

Skeleton to expand:
{skeleton}`,
    ],
  ]);

  const chain = RunnableSequence.from([prompt, getChatModel("reasoning"), new StringOutputParser()]);

  const content = await chain.invoke({
    guidance,
    date,
    professionalContext: buildProfessionalPromptContext(input.project),
    projectContext: buildProjectContextBlock(input.project),
    memory: buildMemoryContextBlock(input.buildingMemory),
    diagnosisCount: String(input.diagnosisItems.length),
    diagnosis: formatDiagnosisForPrompt(input.diagnosisItems),
    strategyCount: String(input.strategies.length),
    strategies: formatStrategiesForPrompt(input.strategies) || "No strategies yet.",
    issues: formatIssuesForPrompt(input.issues) || "No site issues.",
    skeleton: input.skeletonContent.slice(0, 8000),
  });

  return {
    title: input.skeletonTitle,
    content: content.trim() || input.skeletonContent,
  };
}

export async function runPresentationOutlineChain(input: {
  project: ProjectWithRelations;
  strategy: RenovationStrategy;
  skeletonContent: string;
}): Promise<{ title: string; content: string }> {
  if (!isLangChainEnabled()) {
    return {
      title: `Owner Presentation — ${input.project.name}`,
      content: input.skeletonContent,
    };
  }

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "Create an owner presentation outline in Markdown with slide sections. Persuasive but factual.",
    ],
    [
      "human",
      `{projectContext}

Recommended strategy:
{strategy}

Skeleton:
{skeleton}`,
    ],
  ]);

  const chain = RunnableSequence.from([prompt, getChatModel("reasoning"), new StringOutputParser()]);

  const content = await chain.invoke({
    projectContext: buildProjectContextBlock(input.project),
    strategy: `${input.strategy.name}\n${input.strategy.summary}\nDesign goal: ${input.strategy.designGoal}`,
    skeleton: input.skeletonContent,
  });

  return {
    title: `Owner Presentation — ${input.project.name}`,
    content: content.trim() || input.skeletonContent,
  };
}

export async function runMeetingSummaryChain(input: {
  project: ProjectWithRelations;
  notes?: string;
  diagnosisCount: number;
  strategyCount: number;
  skeletonContent: string;
}): Promise<{ title: string; content: string }> {
  if (!isLangChainEnabled()) {
    return {
      title: `Design Meeting Summary — ${input.project.name}`,
      content: input.skeletonContent,
    };
  }

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "Summarize a design meeting for a renovation project. Include decisions and numbered action items.",
    ],
    [
      "human",
      `{projectContext}

Meeting notes: {notes}
Diagnosis items: {diagnosisCount}
Strategies under review: {strategyCount}

Skeleton:
{skeleton}`,
    ],
  ]);

  const chain = RunnableSequence.from([prompt, getChatModel("reasoning"), new StringOutputParser()]);

  const content = await chain.invoke({
    projectContext: buildProjectContextBlock(input.project),
    notes: input.notes ?? "General progress review.",
    diagnosisCount: String(input.diagnosisCount),
    strategyCount: String(input.strategyCount),
    skeleton: input.skeletonContent,
  });

  return {
    title: `Design Meeting Summary — ${input.project.name}`,
    content: content.trim() || input.skeletonContent,
  };
}
