import { NextResponse } from "next/server";
import { getProjectById } from "@/lib/db/repository";
import { runStrategyWorkflow } from "@/lib/ai/workflow/strategy-workflow";
import { guardOrRespond } from "@/lib/auth/api-guard";
import type { StrategyLabParams } from "@/types/ai";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const denied = await guardOrRespond("POST", "/api/projects/*/strategies/generate");
  if (denied) return denied;

  const { projectId } = await params;
  const project = await getProjectById(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const paramsInput = body.params as Partial<StrategyLabParams> | undefined;

  const result = await runStrategyWorkflow(projectId, { params: paramsInput });
  if (!result) {
    return NextResponse.json({ error: "Strategy workflow failed" }, { status: 500 });
  }

  return NextResponse.json(result);
}
