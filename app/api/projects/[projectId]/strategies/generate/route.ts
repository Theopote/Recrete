import { NextResponse } from "next/server";
import { runStrategyWorkflow } from "@/lib/ai/workflow/strategy-workflow";
import { withAIInvocation, aiErrorResponse } from "@/lib/ai";
import { guardOrRespond } from "@/lib/auth/api-guard";
import { requireProjectAccess } from "@/lib/auth/authorize";
import type { StrategyLabParams } from "@/types/ai";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;

  const denied = await guardOrRespond("POST", "/api/projects/*/strategies/generate");
  if (denied) return denied;

  const body = await request.json().catch(() => ({}));
  const paramsInput = body.params as Partial<StrategyLabParams> | undefined;

  try {
    const result = await withAIInvocation(
      {
        organizationId: access.user.organizationId,
        userId: access.user.id,
        operation: "strategy_generate",
      },
      () =>
        runStrategyWorkflow(projectId, access.user.organizationId, {
          params: paramsInput,
        })
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
