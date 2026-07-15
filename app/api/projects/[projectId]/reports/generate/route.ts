import { NextResponse } from "next/server";
import { runReportWorkflow } from "@/lib/ai/workflow/report-workflow";
import type { ReportType } from "@/types";
import { guardOrRespond } from "@/lib/auth/api-guard";
import { requireProjectAccess } from "@/lib/auth/authorize";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;

  const denied = await guardOrRespond("POST", "/api/projects/*/reports/generate");
  if (denied) return denied;

  const body = (await request.json()) as {
    reportType: ReportType;
    strategyId?: string;
    meetingNotes?: string;
  };

  const result = await runReportWorkflow(projectId, access.user.organizationId, {
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
