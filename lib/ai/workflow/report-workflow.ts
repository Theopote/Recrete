import "server-only";

import {
  getProjectById,
  addReport,
  addAnalysisRun,
  updateBuildingMemory,
} from "@/lib/db/repository";
import { getAIPlatform } from "@/lib/ai";
import { reportPipelineModelName } from "@/lib/ai/agents/report-agent";
import { isLangChainEnabled } from "@/lib/ai/langchain/chains";
import type { Report, ReportType } from "@/types";
import type { AIAnalysisRun, BuildingMemory } from "@/types/ai";

export interface ReportWorkflowOptions {
  reportType: ReportType;
  createdById?: string;
  refreshBuildingMemory?: boolean;
  meetingNotes?: string;
  strategyId?: string;
}

export interface ReportWorkflowResult {
  report: Report;
  analysisRun: AIAnalysisRun;
  buildingMemory?: BuildingMemory | null;
}

export async function runReportWorkflow(
  projectId: string,
  organizationId: string,
  options: ReportWorkflowOptions
): Promise<ReportWorkflowResult | null> {
  const {
    reportType,
    createdById = "user-1",
    refreshBuildingMemory = false,
    meetingNotes,
    strategyId,
  } = options;

  const project = await getProjectById(projectId, organizationId);
  if (!project) return null;

  const platform = getAIPlatform();
  let title: string;
  let content: string;

  if (reportType === "design_meeting_summary") {
    const result = await platform.report.generateMeetingSummary(project, meetingNotes);
    title = result.title;
    content = result.content;
  } else if (reportType === "owner_presentation" && strategyId) {
    const strategy = project.strategies?.find((s) => s.id === strategyId);
    if (!strategy) return null;
    const result = await platform.report.generatePresentationOutline(project, strategy);
    title = result.title;
    content = result.content;
  } else {
    const result = await platform.report.generateReport(
      project,
      project.buildingMemory ?? null,
      project.diagnosis ?? [],
      project.strategies ?? [],
      project.issues ?? [],
      reportType
    );
    title = result.title;
    content = result.content;
  }

  const report = await addReport(projectId, {
    title,
    type: reportType,
    content,
    status: "ready",
    createdById,
    generatedByAI: true,
  });

  const analysisRun = await addAnalysisRun({
    projectId,
    analysisType: "report_generation",
    inputSummary: `Report pipeline — ${reportType}${isLangChainEnabled() ? " + LangChain" : ""}`,
    outputSummary: content.slice(0, 500),
    generatedItemCount: 1,
    modelName: reportPipelineModelName(reportType),
    confidence: isLangChainEnabled() ? 0.89 : 0.84,
  });

  let buildingMemory: BuildingMemory | null | undefined;
  if (refreshBuildingMemory) {
    buildingMemory = await updateBuildingMemory(projectId, organizationId);
  }

  return { report, analysisRun, buildingMemory };
}
