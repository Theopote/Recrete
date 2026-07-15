import { NextResponse } from "next/server";
import { getBimModel } from "@/lib/bim/bim-model-repository";
import { buildSpatialAnalytics } from "@/lib/bim/spatial-analytics";
import { enrichSpatialAnalyticsWithAi } from "@/lib/bim/spatial-planning-ai";
import { requireProjectAccess } from "@/lib/auth/authorize";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string; modelId: string }> }
) {
  const { projectId, modelId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;
  const { project } = access;

  const model = await getBimModel(projectId, modelId);
  if (!model) {
    return NextResponse.json({ error: "Model not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const strategyId = url.searchParams.get("strategyId");
  const fromRoomId = url.searchParams.get("fromRoomId") ?? undefined;
  const toRoomId = url.searchParams.get("toRoomId") ?? undefined;
  const withAi = url.searchParams.get("withAi") === "true";

  const strategy =
    strategyId != null && strategyId !== ""
      ? project.strategies?.find((item) => item.id === strategyId) ?? null
      : null;

  let analytics = buildSpatialAnalytics(project, model, strategy, {
    fromRoomId,
    toRoomId,
  });

  if (!analytics) {
    return NextResponse.json(
      { error: "No room data available for spatial analytics" },
      { status: 400 }
    );
  }

  if (withAi) {
    analytics = await enrichSpatialAnalyticsWithAi(
      analytics,
      strategy?.designGoal ?? project.targetFunction
    );
  }

  return NextResponse.json(analytics);
}
