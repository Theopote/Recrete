import { NextResponse } from "next/server";
import { getProjectById } from "@/lib/db/repository";
import { getBimModel } from "@/lib/bim/bim-model-repository";
import { buildSpatialAnalytics } from "@/lib/bim/spatial-analytics";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string; modelId: string }> }
) {
  const { projectId, modelId } = await params;
  const project = await getProjectById(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const model = await getBimModel(projectId, modelId);
  if (!model) {
    return NextResponse.json({ error: "Model not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const strategyId = url.searchParams.get("strategyId");
  const fromRoomId = url.searchParams.get("fromRoomId") ?? undefined;
  const toRoomId = url.searchParams.get("toRoomId") ?? undefined;

  const strategy =
    strategyId != null && strategyId !== ""
      ? project.strategies?.find((item) => item.id === strategyId) ?? null
      : null;

  const analytics = buildSpatialAnalytics(project, model, strategy, {
    fromRoomId,
    toRoomId,
  });

  if (!analytics) {
    return NextResponse.json(
      { error: "No room data available for spatial analytics" },
      { status: 400 }
    );
  }

  return NextResponse.json(analytics);
}
