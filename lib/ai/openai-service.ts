import type { AIService, ProjectContext } from "./types";
import type {
  DiagnosisItem,
  ProjectWithRelations,
  RenovationStrategy,
  ReportType,
  SiteIssue,
} from "@/types";
import type { AIMessage } from "@/types";
import type { BuildingMemory } from "@/types/ai";
import { chatCompletion, chatJsonArray, chatJsonObject } from "./openai-client";
import { loadRenovationContextBlock } from "./load-renovation-context";
import {
  collectStructuredProjectBriefFacts,
  formatProjectBriefConstraintsBlock,
} from "./project-brief-context";
import {
  buildAssistantSystemPrompt,
  buildAssistantSystemPromptFromContext,
  buildDiagnosisPrompt,
  buildReportPrompt,
  buildStrategyPrompt,
} from "./prompts";
import { getElevatorFeasibilityResult } from "@/lib/db/elevator-feasibility-store";

export class OpenAIService implements AIService {
  async generateDiagnosis(
    project: ProjectWithRelations
  ): Promise<Omit<DiagnosisItem, "id" | "projectId" | "createdAt" | "updatedAt">[]> {
    const contextBlock = await loadRenovationContextBlock(project);
    const prompt = buildDiagnosisPrompt(project, contextBlock);
    return chatJsonArray<
      Omit<DiagnosisItem, "id" | "projectId" | "createdAt" | "updatedAt">
    >(
      [
        {
          role: "system",
          content:
            "You are a building renovation expert for existing buildings in China. Ground each diagnosis item in uploaded document analysis and evidence when provided. Return JSON: { \"items\": [ { title, category, severity, status, description, evidence, recommendation, relatedLocation } ] }. Categories: architecture, structure, facade, mep, fire_safety, accessibility, energy, heritage, operation. Reference specific document findings in evidence field when available.",
        },
        { role: "user", content: prompt },
      ],
      { scenario: "reasoning", temperature: 0.3 }
    );
  }

  async generateRenovationStrategies(
    project: ProjectWithRelations,
    diagnosisItems: DiagnosisItem[]
  ): Promise<
    Omit<RenovationStrategy, "id" | "projectId" | "createdAt" | "updatedAt">[]
  > {
    const contextBlock = await loadRenovationContextBlock(project, {
      includeDiagnosis: true,
      includeMemory: true,
    });
    const briefFacts = collectStructuredProjectBriefFacts(project.documents ?? []);
    const briefConstraints = formatProjectBriefConstraintsBlock(briefFacts);
    const elevatorFeasibility = await getElevatorFeasibilityResult(project.id);
    const prompt = buildStrategyPrompt(
      project,
      diagnosisItems,
      contextBlock,
      briefConstraints,
      elevatorFeasibility ?? undefined
    );

    return chatJsonArray<
      Omit<RenovationStrategy, "id" | "projectId" | "createdAt" | "updatedAt">
    >(
      [
        {
          role: "system",
          content:
            'Return JSON: { "strategies": [ { name, type, summary, designGoal, spatialStrategy, structuralStrategy, facadeStrategy, mepStrategy, costLevel, scheduleLevel, riskLevel, pros[], cons[] } ] }. Generate exactly 3 strategies with types light_renewal, medium_renovation, deep_recreation only. spatialStrategy must reference drawing graph room labels when provided. Do not include recommendationReason.',
        },
        { role: "user", content: prompt },
      ],
      { scenario: "reasoning", temperature: 0.5 }
    );
  }

  async refineRenovationStrategy(
    project: ProjectWithRelations,
    strategy: RenovationStrategy,
    instruction: string
  ): Promise<Omit<RenovationStrategy, "id" | "projectId" | "createdAt" | "updatedAt">> {
    const contextBlock = await loadRenovationContextBlock(project, {
      includeDiagnosis: true,
      includeMemory: true,
    });

    const result = await chatJsonObject<
      Omit<RenovationStrategy, "id" | "projectId" | "createdAt" | "updatedAt">
    >(
      [
        {
          role: "system",
          content:
            'You refine an existing building renovation strategy. Return JSON: { "strategy": { name, type, summary, designGoal, spatialStrategy, structuralStrategy, facadeStrategy, mepStrategy, costLevel, scheduleLevel, riskLevel, pros[], cons[], recommendationReason } }. Keep type unchanged unless instruction requires intervention depth change. Apply instruction while respecting project evidence and diagnosis.',
        },
        {
          role: "user",
          content: `## Refinement instruction\n${instruction}\n\n## Project & evidence\n${contextBlock}\n\n## Current strategy\n${JSON.stringify(
            {
              name: strategy.name,
              type: strategy.type,
              summary: strategy.summary,
              designGoal: strategy.designGoal,
              spatialStrategy: strategy.spatialStrategy,
              structuralStrategy: strategy.structuralStrategy,
              facadeStrategy: strategy.facadeStrategy,
              mepStrategy: strategy.mepStrategy,
              costLevel: strategy.costLevel,
              scheduleLevel: strategy.scheduleLevel,
              riskLevel: strategy.riskLevel,
              pros: strategy.pros,
              cons: strategy.cons,
              recommendationReason: strategy.recommendationReason,
            },
            null,
            2
          )}`,
        },
      ],
      { scenario: "reasoning", temperature: 0.45 }
    );

    return {
      ...result,
      name: result.name.includes("(refined)") ? result.name : `${result.name} (refined)`,
    };
  }

  async synthesizeBuildingMemory(
    project: ProjectWithRelations
  ): Promise<Omit<BuildingMemory, "id" | "createdAt" | "updatedAt">> {
    const contextBlock = await loadRenovationContextBlock(project, {
      includeDiagnosis: true,
      includeStrategies: true,
    });

    const memory = await chatJsonObject<
      Omit<BuildingMemory, "id" | "createdAt" | "updatedAt" | "projectId" | "lastUpdatedByAI">
    >(
      [
        {
          role: "system",
          content:
            'Synthesize an updated Building Memory for an existing building renovation project. Return JSON: { "memory": { summary, knownFacts[], missingInformation[], keyRisks[], renovationPotential, designConstraints[], ownerRequirements[], importantDecisions[], unresolvedQuestions[] } }. Be specific to this project. knownFacts must cite document/evidence findings when available. missingInformation should list what blocks schematic design.',
        },
        {
          role: "user",
          content: `## Project\n${project.name} — ${project.targetFunction}\nGoal: ${project.renovationGoal}\n\n${contextBlock}`,
        },
      ],
      { scenario: "reasoning", temperature: 0.35 }
    );

    return {
      ...memory,
      projectId: project.id,
      lastUpdatedByAI: new Date(),
    };
  }

  async generateReport(
    project: ProjectWithRelations,
    diagnosisItems: DiagnosisItem[],
    strategies: RenovationStrategy[],
    issues: SiteIssue[],
    reportType: ReportType
  ): Promise<{ title: string; content: string }> {
    const prompt = buildReportPrompt(project, reportType);
    const context = JSON.stringify({
      project: { name: project.name, code: project.code, location: project.location },
      diagnosisCount: diagnosisItems.length,
      strategyCount: strategies.length,
      issueCount: issues.length,
    });

    const content = await chatCompletion(
      [
        {
          role: "system",
          content:
            "Generate a professional Markdown report for a building renovation project. Use headings, tables where helpful, bilingual terms OK.",
        },
        { role: "user", content: `${prompt}\n\nContext: ${context}` },
      ],
      { scenario: "reasoning", temperature: 0.4, maxTokens: 4096 }
    );

    return {
      title: `${reportType.replace(/_/g, " ")} — ${project.name}`,
      content,
    };
  }

  async askProjectAssistant(
    projectContext: ProjectContext,
    messages: AIMessage[]
  ): Promise<string> {
    const systemPrompt = projectContext.buildingMemory
      ? buildAssistantSystemPromptFromContext({
          project: projectContext.project,
          buildingMemory: projectContext.buildingMemory,
          insights: projectContext.insights ?? [],
          tasks: [],
          analysisRuns: [],
          evidence: projectContext.evidence ?? [],
          knowledgeSnippets: projectContext.knowledgeSnippets ?? [],
        })
      : buildAssistantSystemPrompt(projectContext.project);

    return chatCompletion(
      [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
      { scenario: "copilot", temperature: 0.6 }
    );
  }
}

export const openAIService = new OpenAIService();
