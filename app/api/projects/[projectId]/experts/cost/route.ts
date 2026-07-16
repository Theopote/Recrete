import { NextResponse } from "next/server";
import { requireProjectAccess } from "@/lib/auth/authorize";
import { prepareAndEstimateProjectCost } from "@/lib/ai/agents/cost-estimator-agent";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;
  const { project } = access;

  const body = await request.json().catch(() => ({}));
  const strategy =
    (project.strategies ?? []).find((s) => s.id === body.strategyId) ??
    project.strategies?.[0] ??
    null;

  const estimate = await prepareAndEstimateProjectCost(project, strategy, {
    strategyType: body.strategyType,
    preservationLevel: body.preservationLevel,
    contingencyPercent: body.contingencyPercent,
  });

  return NextResponse.json({ estimate, strategyId: strategy?.id ?? null });
}
