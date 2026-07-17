import { NextResponse } from "next/server";
import { runDiagnosisEvidenceRelinkWorkflow } from "@/lib/ai/workflow/diagnosis-workflow";
import { requireProjectAccess } from "@/lib/auth/authorize";
import { guardOrRespond } from "@/lib/auth/api-guard";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;

  const denied = await guardOrRespond("POST", "/api/projects/*/diagnosis/relink-evidence");
  if (denied) return denied;

  const result = await runDiagnosisEvidenceRelinkWorkflow(
    projectId,
    access.user.organizationId
  );

  if (!result) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
