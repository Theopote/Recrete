import { NextResponse } from "next/server";
import { getProjectById } from "@/lib/db/repository";
import { runReportWorkflow } from "@/lib/ai/workflow/report-workflow";
import type { ReportType } from "@/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const project = await getProjectById(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    reportType: ReportType;
    strategyId?: string;
    meetingNotes?: string;
  };

  const result = await runReportWorkflow(projectId, {
    reportType: body.reportType,
    strategyId: body.strategyId,
    meetingNotes: body.meetingNotes,
  });

  if (!result) {
    return NextResponse.json({ error: "Report generation failed" }, { status: 400 });
  }

  return NextResponse.json({
    ...result.report,
    analysisRun: result.analysisRun,
  });
}
