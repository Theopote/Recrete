import type { AIService, ProjectContext } from "./types";
import type {
  DiagnosisItem,
  ProjectWithRelations,
  RenovationStrategy,
  ReportType,
  SiteIssue,
} from "@/types";
import type { AIMessage } from "@/types";
import { chatCompletion, chatJsonArray } from "./openai-client";
import {
  buildAssistantSystemPrompt,
  buildAssistantSystemPromptFromContext,
  buildDiagnosisPrompt,
  buildReportPrompt,
  buildStrategyPrompt,
} from "./prompts";

export class OpenAIService implements AIService {
  async generateDiagnosis(
    project: ProjectWithRelations
  ): Promise<Omit<DiagnosisItem, "id" | "projectId" | "createdAt" | "updatedAt">[]> {
    const prompt = buildDiagnosisPrompt(project);
    return chatJsonArray<
      Omit<DiagnosisItem, "id" | "projectId" | "createdAt" | "updatedAt">
    >(
      [
        {
          role: "system",
          content:
            "You are a building renovation expert for existing buildings in China. Return JSON: { \"items\": [ { title, category, severity, status, description, evidence, recommendation, relatedLocation } ] }. Categories: architecture, structure, facade, mep, fire_safety, accessibility, energy, heritage, operation.",
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
    const prompt = buildStrategyPrompt(project, diagnosisItems.length);
    const diagnosisContext = diagnosisItems
      .slice(0, 12)
      .map((d) => `- [${d.severity}] ${d.title}: ${d.description}`)
      .join("\n");

    return chatJsonArray<
      Omit<RenovationStrategy, "id" | "projectId" | "createdAt" | "updatedAt">
    >(
      [
        {
          role: "system",
          content:
            'Return JSON: { "strategies": [ { name, type, summary, designGoal, spatialStrategy, structuralStrategy, facadeStrategy, mepStrategy, costLevel, scheduleLevel, riskLevel, pros[], cons[], recommendationReason } ] }. Generate exactly 3 strategies: light, medium, deep renovation.',
        },
        {
          role: "user",
          content: `${prompt}\n\nDiagnosis context:\n${diagnosisContext || "No diagnosis yet."}`,
        },
      ],
      { scenario: "reasoning", temperature: 0.5 }
    );
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
