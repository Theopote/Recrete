import { NextResponse } from "next/server";
import { getProjectById, replaceStrategies } from "@/lib/db/repository";
import { getAIPlatform } from "@/lib/ai";
import { computeStrategyMetrics } from "@/lib/utils/strategy-metrics";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const project = await getProjectById(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const strategies = await getAIPlatform().strategy.generateRenovationStrategies(
    project,
    project.diagnosis ?? []
  );
  const created = await replaceStrategies(projectId, strategies);

  const withMetrics = created.map((s) => ({
    ...s,
    metrics: computeStrategyMetrics(s),
  }));

  return NextResponse.json(withMetrics);
}
