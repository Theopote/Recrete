import { NextResponse } from "next/server";
import { getProjectById } from "@/lib/db/repository";
import { getAIPlatform } from "@/lib/ai";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const project = await getProjectById(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const platform = getAIPlatform();
  const strategy =
    (project.strategies ?? []).find((s) => s.id === body.strategyId) ??
    project.strategies?.[0] ??
    null;

  const estimate = platform.costEstimator.estimateProjectCost(project, strategy, {
    strategyType: body.strategyType,
    preservationLevel: body.preservationLevel,
    contingencyPercent: body.contingencyPercent,
  });

  return NextResponse.json({ estimate, strategyId: strategy?.id ?? null });
}
