import { NextResponse } from "next/server";
import { getProjectById } from "@/lib/db/repository";
import { runSurveyWorkflow } from "@/lib/ai/workflow/survey-workflow";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const project = await getProjectById(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const result = await runSurveyWorkflow(projectId);
  if (!result) {
    return NextResponse.json({ error: "Survey workflow failed" }, { status: 500 });
  }

  return NextResponse.json(result);
}
