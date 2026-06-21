import type { DiagnosisItem, ProjectWithRelations, RenovationStrategy, SiteIssue, ReportType } from "@/types";
import type { BuildingMemory } from "@/types/ai";
import { mockAIService } from "../mock-ai-service";
import { withMockDelay } from "../providers/utils";

export async function generateReport(
  project: ProjectWithRelations,
  _buildingMemory: BuildingMemory | null | undefined,
  diagnosisItems: DiagnosisItem[],
  strategies: RenovationStrategy[],
  issues: SiteIssue[],
  reportType: ReportType
) {
  return mockAIService.generateReport(project, diagnosisItems, strategies, issues, reportType);
}

export async function generatePresentationOutline(
  project: ProjectWithRelations,
  strategy: RenovationStrategy
) {
  return withMockDelay(
    () => ({
      title: `Owner Presentation — ${project.name}`,
      content: `# Owner Presentation Outline\n\n## Vision\n${project.renovationGoal}\n\n## Recommended Strategy\n${strategy.name}\n\n${strategy.summary}\n\n## Key Metrics\n- Cost: ${strategy.costLevel}\n- Schedule: ${strategy.scheduleLevel}\n- Design value: ${strategy.designValueScore ?? "N/A"}/100`,
    }),
    800
  );
}

export async function generateMeetingSummary(
  project: ProjectWithRelations,
  notes?: string
) {
  return withMockDelay(
    () => ({
      title: `Design Meeting Summary — ${project.name}`,
      content: `# Design Meeting Summary\n\n**Project:** ${project.name}\n**Date:** ${new Date().toLocaleDateString()}\n\n## Notes\n${notes ?? "No notes provided — summary generated from project context."}\n\n## Status\nPhase: ${project.status} | Health: ${project.healthScore}/100\n\n## Action Items\n1. Complete missing surveys\n2. Finalize strategy selection\n3. Schedule structural engineer review`,
    }),
    700
  );
}
