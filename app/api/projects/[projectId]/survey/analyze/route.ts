import { NextResponse } from "next/server";
import { runSurveyWorkflow } from "@/lib/ai/workflow/survey-workflow";
import { requireProjectAccess } from "@/lib/auth/authorize";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;

  const result = await runSurveyWorkflow(projectId, access.user.organizationId);
  if (!result) {
    return NextResponse.json({ error: "Survey workflow failed" }, { status: 500 });
  }

  return NextResponse.json(result);
}
