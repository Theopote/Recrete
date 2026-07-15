import { NextResponse } from "next/server";
import { runDiagnosisWorkflow } from "@/lib/ai/workflow/diagnosis-workflow";
import { withAIInvocation, aiErrorResponse } from "@/lib/ai";
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

  try {
    const result = await withAIInvocation(
      {
        organizationId: access.user.organizationId,
        userId: access.user.id,
        operation: "diagnosis_generate",
      },
      () => runDiagnosisWorkflow(projectId, access.user.organizationId)
    );

    if (!result) {
      return NextResponse.json(
        {
          error: "NOT_FOUND",
          code: "NOT_FOUND",
          message: "项目不存在或无权访问。",
          retryable: false,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    return aiErrorResponse(error);
  }
}
