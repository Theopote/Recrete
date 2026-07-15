import { NextResponse } from "next/server";
import { getProjectById } from "@/lib/db/repository";
import { runDiagnosisWorkflow } from "@/lib/ai/workflow/diagnosis-workflow";
import { guardOrRespond } from "@/lib/auth/api-guard";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const denied = await guardOrRespond("POST", "/api/projects/*/diagnosis/generate");
  if (denied) return denied;

  const { projectId } = await params;
  const project = await getProjectById(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const result = await runDiagnosisWorkflow(projectId);
  if (!result) {
    return NextResponse.json({ error: "Diagnosis workflow failed" }, { status: 500 });
  }

  return NextResponse.json(result);
}
