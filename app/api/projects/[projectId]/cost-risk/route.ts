import { NextResponse } from "next/server";
import { getProjectById } from "@/lib/db/repository";
import { getAIPlatform } from "@/lib/ai";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const project = await getProjectById(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const strategies = project.strategies ?? [];
  const platform = getAIPlatform();
  const matrix = await platform.costRisk.generateRiskMatrix(project, strategies);
  const phasingPlan =
    strategies.length > 0
      ? await platform.costRisk.suggestPhasingPlan(project, strategies[0])
      : matrix.phasingPlan;

  return NextResponse.json({ matrix, phasingPlan });
}
