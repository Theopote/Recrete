import { NextResponse } from "next/server";
import { runDiagnosisWorkflow } from "@/lib/ai/workflow/diagnosis-workflow";
import { guardOrRespond } from "@/lib/auth/api-guard";
import { requireProjectAccess } from "@/lib/auth/authorize";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;

  const denied = await guardOrRespond("POST", "/api/projects/*/diagnosis/generate");
  if (denied) return denied;

  const result = await runDiagnosisWorkflow(projectId, access.user.organizationId);
  if (!result) {
    return NextResponse.json({ error: "Diagnosis workflow failed" }, { status: 500 });
  }

  return NextResponse.json(result);
}
