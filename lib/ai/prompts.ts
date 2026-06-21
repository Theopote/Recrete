import type { ProjectWithRelations, ReportType } from "@/types";

export function buildDiagnosisPrompt(project: ProjectWithRelations): string {
  return `Analyze the following existing building for renovation diagnosis:

Project: ${project.name}
Location: ${project.location}
Building Type: ${project.buildingType}
Construction Year: ${project.constructionYear}
Structure: ${project.structureType}
Current Function: ${project.currentFunction}
Target Function: ${project.targetFunction}
Renovation Goal: ${project.renovationGoal}
Current Condition: ${project.building?.currentCondition ?? "Unknown"}

Generate diagnosis items across architecture, structure, facade, MEP, fire safety, accessibility, energy, and heritage categories.`;
}

export function buildStrategyPrompt(
  project: ProjectWithRelations,
  diagnosisCount: number
): string {
  return `Generate renovation strategies for:

Project: ${project.name}
Target Function: ${project.targetFunction}
Renovation Goal: ${project.renovationGoal}
Budget Level: ${project.budgetLevel}
Risk Level: ${project.riskLevel}

Based on ${diagnosisCount} identified diagnosis items, propose multiple renovation strategies with cost, schedule, and risk assessments.`;
}

export function buildReportPrompt(
  project: ProjectWithRelations,
  reportType: ReportType
): string {
  return `Generate a ${reportType.replace(/_/g, " ")} for project ${project.name} (${project.code}) at ${project.location}.`;
}

export function buildAssistantSystemPrompt(project: ProjectWithRelations): string {
  return `You are Recrete AI, an expert assistant for building renovation projects.
You are helping with project "${project.name}" — a ${project.buildingType} in ${project.location}.
Construction year: ${project.constructionYear}. Structure: ${project.structureType}.
Renovation goal: ${project.renovationGoal}
Current status: ${project.status}. Health score: ${project.healthScore}/100. Risk: ${project.riskLevel}.

Provide professional, concise advice for architects, engineers, and project managers working on existing building renovation.`;
}

export const ASSISTANT_SUGGESTIONS = [
  "What are the main risks of this building?",
  "What information is missing?",
  "Generate three renovation strategies.",
  "Which strategy is most feasible?",
  "What should we do before schematic design?",
  "List structural issues requiring engineer review.",
  "Generate a client presentation outline.",
  "Generate a meeting agenda.",
  "Summarize this project for the owner.",
] as const;

export const CREATE_PROJECT_SUGGESTIONS = [
  "我有一栋 1986 年建成的混凝土框架办公楼，位于西安，原本是政府办公，现在想改成社区文化中心，预算有限，希望保留主体结构。",
  "1998 brick warehouse in Shanghai, vacant 5 years, convert to creative office with rooftop event space.",
  "1970s school building in Chengdu, need adaptive reuse as community library, medium budget.",
] as const;
