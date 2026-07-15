import { NextResponse } from "next/server";
import { runStrategyWorkflow } from "@/lib/ai/workflow/strategy-workflow";
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

  const result = await runStrategyWorkflow(projectId, access.user.organizationId, { params: paramsInput });
  if (!result) {
    return NextResponse.json({ error: "Strategy workflow failed" }, { status: 500 });
  }

  return NextResponse.json(result);
}
