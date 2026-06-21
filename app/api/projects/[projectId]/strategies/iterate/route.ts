import { NextResponse } from "next/server";
import { getProjectById } from "@/lib/db/repository";
import { runStrategyIterationWorkflow } from "@/lib/ai/workflow/strategy-workflow";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const project = await getProjectById(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = await request.json();
  const { strategyId, instruction } = body as { strategyId?: string; instruction?: string };

  if (!strategyId || !instruction?.trim()) {
    return NextResponse.json(
      { error: "strategyId and instruction are required" },
      { status: 400 }
    );
  }

  const result = await runStrategyIterationWorkflow(projectId, {
    strategyId,
    instruction: instruction.trim(),
  });

  if (!result) {
    return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
