import type { AIService, ProjectContext } from "./types";
import type {
  DiagnosisItem,
  ProjectWithRelations,
  RenovationStrategy,
  ReportType,
  SiteIssue,
} from "@/types";
import type { AIMessage } from "@/types";
import {
  buildAssistantSystemPrompt,
  buildAssistantSystemPromptFromContext,
  buildDiagnosisPrompt,
  buildReportPrompt,
  buildStrategyPrompt,
} from "./prompts";

export class OpenAIService implements AIService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(options?: { apiKey?: string; baseUrl?: string; model?: string }) {
    this.apiKey = options?.apiKey ?? process.env.OPENAI_API_KEY ?? "";
    this.baseUrl = options?.baseUrl ?? "https://api.openai.com/v1";
    this.model = options?.model ?? "gpt-4o-mini";
  }

  private async chat(messages: { role: string; content: string }[]): Promise<string> {
    if (!this.apiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content ?? "";
  }

  async generateDiagnosis(
    project: ProjectWithRelations
  ): Promise<Omit<DiagnosisItem, "id" | "projectId" | "createdAt" | "updatedAt">[]> {
    const prompt = buildDiagnosisPrompt(project);
    const content = await this.chat([
      {
        role: "system",
        content:
          "You are a building renovation expert. Return JSON array of diagnosis items with fields: title, category, severity, status, description, evidence, recommendation, relatedLocation.",
      },
      { role: "user", content: prompt },
    ]);

    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      throw new Error("Failed to parse AI diagnosis response");
    }
  }

  async generateRenovationStrategies(
    project: ProjectWithRelations,
    diagnosisItems: DiagnosisItem[]
  ): Promise<
    Omit<RenovationStrategy, "id" | "projectId" | "createdAt" | "updatedAt">[]
  > {
    const prompt = buildStrategyPrompt(project, diagnosisItems.length);
    const content = await this.chat([
      {
        role: "system",
        content:
          "You are a renovation strategy expert. Return JSON array of strategies with all required fields including pros and cons arrays.",
      },
      { role: "user", content: prompt },
    ]);

    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      throw new Error("Failed to parse AI strategy response");
    }
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

    const content = await this.chat([
      {
        role: "system",
        content: "Generate a professional Markdown report for a building renovation project.",
      },
      { role: "user", content: `${prompt}\n\nContext: ${context}` },
    ]);

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
    const chatMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    return this.chat(chatMessages);
  }
}

export const openAIService = new OpenAIService();
