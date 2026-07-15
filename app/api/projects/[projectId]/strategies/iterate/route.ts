import { NextResponse } from "next/server";
import { runStrategyIterationWorkflow } from "@/lib/ai/workflow/strategy-workflow";
import { requireProjectAccess } from "@/lib/auth/authorize";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;

  const body = await request.json();
  const { strategyId, instruction } = body as { strategyId?: string; instruction?: string };

  if (!strategyId || !instruction?.trim()) {
    return NextResponse.json(
      { error: "strategyId and instruction are required" },
      { status: 400 }
    );
  }

  const result = await runStrategyIterationWorkflow(projectId, access.user.organizationId, {
    strategyId,
    instruction: instruction.trim(),
  });

  if (!result) {
    return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
