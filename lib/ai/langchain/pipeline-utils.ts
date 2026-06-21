import "server-only";

import type {
  DiagnosisItem,
  ProjectWithRelations,
  RenovationStrategy,
  SiteIssue,
  ReportType,
} from "@/types";
import type { BuildingMemory } from "@/types/ai";

export function formatDiagnosisForPrompt(items: DiagnosisItem[], limit = 30): string {
  return items
    .slice(0, limit)
    .map(
      (d, i) =>
        `${i + 1}. [${d.category}/${d.severity}] ${d.title}\n   ${d.description}\n   Recommendation: ${d.recommendation ?? "TBD"}`
    )
    .join("\n\n");
}

export function formatStrategiesForPrompt(strategies: RenovationStrategy[]): string {
  return strategies
    .map(
      (s, i) =>
        `${i + 1}. ${s.name} (${s.type})\n   Cost/Schedule/Risk: ${s.costLevel}/${s.scheduleLevel}/${s.riskLevel}\n   ${s.summary}\n   ${s.recommendationReason ? `Recommended: ${s.recommendationReason}` : ""}`
    )
    .join("\n\n");
}

export function formatIssuesForPrompt(issues: SiteIssue[]): string {
  return issues
    .map((i) => `- [${i.priority}/${i.status}] ${i.title} — ${i.location ?? "TBD"}: ${i.description}`)
    .join("\n");
}

export function buildProjectContextBlock(project: ProjectWithRelations): string {
  return [
    `Project: ${project.name} (${project.code})`,
    `Location: ${project.location}`,
    `Building: ${project.buildingType}, ${project.constructionYear}, ${project.structureType}`,
    `Area: ${project.grossFloorArea} m², ${project.floorCount} floors`,
    `Function: ${project.originalFunction} → ${project.currentFunction} → ${project.targetFunction}`,
    `Renovation goal: ${project.renovationGoal}`,
    `Health ${project.healthScore}/100, Potential ${project.potentialScore}/100, Risk ${project.riskLevel}`,
    `Budget: ${project.budgetLevel}`,
    project.building?.currentCondition
      ? `Condition: ${project.building.currentCondition}`
      : null,
    project.building?.heritageLevel
      ? `Heritage: ${project.building.heritageLevel}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildMemoryContextBlock(memory?: BuildingMemory | null): string {
  if (!memory) return "No building memory recorded.";
  const known = memory.knownFacts?.slice(0, 6).map((f) => `- ${f}`).join("\n") ?? "";
  const risks = memory.keyRisks?.slice(0, 5).map((r) => `- ${r}`).join("\n") ?? "";
  return `Known facts:\n${known || "None"}\n\nKey risks:\n${risks || "None"}`;
}

export function extractJsonArray<T>(text: string): T[] | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced?.[1]?.trim() ?? text.trim();
  const arrayMatch = candidate.match(/\[[\s\S]*\]/);
  if (!arrayMatch) return null;
  try {
    const parsed = JSON.parse(arrayMatch[0]);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function langChainModelLabel(suffix: string): string {
  return `langchain-${process.env.OPENAI_MODEL ?? "gpt-4o-mini"}-${suffix}`;
}

export const REPORT_TYPE_GUIDANCE: Record<ReportType, string> = {
  existing_condition_report:
    "Professional existing condition report with executive summary, building overview table, findings, open issues, and prioritized recommendations.",
  diagnosis_report:
    "Building diagnosis report grouped by category with severity counts and per-item recommendations.",
  renovation_strategy_report:
    "Strategy comparison report with pros/cons and recommendation rationale for adaptive reuse decision-making.",
  owner_presentation:
    "Owner presentation outline in slide format (5–8 slides) with vision, asset, challenges, strategy, next steps.",
  government_submission:
    "Government/urban renewal submission draft covering background, public benefit, technical summary, compliance.",
  site_issue_report:
    "Site issue tracker report separating open vs resolved issues with locations and priorities.",
  design_meeting_summary:
    "Design meeting summary with discussion topics, decisions, and numbered action items.",
};
