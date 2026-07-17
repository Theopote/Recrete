import type {
  DiagnosisItem,
  ProjectWithRelations,
  RenovationStrategy,
  SiteIssue,
  ReportType,
} from "@/types";
import type { BuildingMemory } from "@/types/ai";
import { mockAIService } from "../mock-ai-service";
import { withMockDelay } from "../providers/utils";
import { analyzeEnergyPerformance, appendEnergySectionToReport } from "./energy-agent";
import {
  runReportGenerationChain,
  runPresentationOutlineChain,
  runMeetingSummaryChain,
  langChainModelLabel,
} from "../langchain/report-chain";
import { isLangChainEnabled } from "../langchain/chains";
import type { ComplianceEngineReport } from "../compliance/types";
import { buildStrategyConditionedReportContent } from "../strategy-conditioned-report";

const REPORT_TYPES_WITH_ENERGY = new Set<ReportType>([
  "diagnosis_report",
  "existing_condition_report",
]);

export function reportPipelineModelName(reportType: ReportType): string {
  return isLangChainEnabled()
    ? langChainModelLabel(`report-${reportType}`)
    : "recrete-report-v1";
}

export async function generateReport(
  project: ProjectWithRelations,
  buildingMemory: BuildingMemory | null | undefined,
  diagnosisItems: DiagnosisItem[],
  strategies: RenovationStrategy[],
  issues: SiteIssue[],
  reportType: ReportType
) {
  const base = await mockAIService.generateReport(
    project,
    diagnosisItems,
    strategies,
    issues,
    reportType
  );

  let result = await runReportGenerationChain({
    project,
    buildingMemory,
    diagnosisItems,
    strategies,
    issues,
    reportType,
    skeletonTitle: base.title,
    skeletonContent: base.content,
  });

  if (REPORT_TYPES_WITH_ENERGY.has(reportType)) {
    const energyAnalysis = analyzeEnergyPerformance(project);
    result = {
      ...result,
      content: appendEnergySectionToReport(result.content, energyAnalysis),
    };
  }

  return withMockDelay(() => result, isLangChainEnabled() ? 200 : 800);
}

export async function generateStrategyConditionedReport(
  project: ProjectWithRelations,
  buildingMemory: BuildingMemory | null | undefined,
  diagnosisItems: DiagnosisItem[],
  strategies: RenovationStrategy[],
  issues: SiteIssue[],
  selectedStrategy: RenovationStrategy,
  complianceReport: ComplianceEngineReport
) {
  const skeleton = buildStrategyConditionedReportContent({
    project,
    selectedStrategy,
    allStrategies: strategies,
    diagnosisItems,
    issues,
    complianceReport,
  });

  return runReportGenerationChain({
    project,
    buildingMemory,
    diagnosisItems,
    strategies,
    issues,
    reportType: "renovation_strategy_report",
    skeletonTitle: skeleton.title,
    skeletonContent: skeleton.content,
  });
}

export async function generatePresentationOutline(
  project: ProjectWithRelations,
  strategy: RenovationStrategy
) {
  const skeleton = await withMockDelay(
    () => ({
      title: `Owner Presentation — ${project.name}`,
      content: `# Owner Presentation Outline\n\n## Vision\n${project.renovationGoal}\n\n## Recommended Strategy\n${strategy.name}\n\n${strategy.summary}\n\n## Key Metrics\n- Cost: ${strategy.costLevel}\n- Schedule: ${strategy.scheduleLevel}\n- Design value: ${strategy.designValueScore ?? "N/A"}/100`,
    }),
    300
  );

  return runPresentationOutlineChain({
    project,
    strategy,
    skeletonContent: skeleton.content,
  });
}

export async function generateMeetingSummary(
  project: ProjectWithRelations,
  notes?: string
) {
  const skeleton = await withMockDelay(
    () => ({
      title: `Design Meeting Summary — ${project.name}`,
      content: `# Design Meeting Summary\n\n**Project:** ${project.name}\n**Date:** ${new Date().toLocaleDateString()}\n\n## Notes\n${notes ?? "No notes provided — summary generated from project context."}\n\n## Status\nPhase: ${project.status} | Health: ${project.healthScore}/100`,
    }),
    300
  );

  return runMeetingSummaryChain({
    project,
    notes,
    diagnosisCount: project.diagnosis?.length ?? 0,
    strategyCount: project.strategies?.length ?? 0,
    skeletonContent: skeleton.content,
  });
}
