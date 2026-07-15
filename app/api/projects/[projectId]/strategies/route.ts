import { NextResponse } from "next/server";
import { addStrategies } from "@/lib/db/repository";
import { requireProjectAccess } from "@/lib/auth/authorize";
import { strategySchema } from "@/lib/validators/project";
import { computeStrategyMetrics } from "@/lib/utils/strategy-metrics";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;

  try {
    const body = await request.json();
    const parsed = strategySchema.parse(body);
    const { pros, cons, recommendationReason, ...rest } = parsed;

    const [created] = await addStrategies(projectId, [{
      ...rest,
      pros: pros.split("\n").map((s) => s.trim()).filter(Boolean),
      cons: cons.split("\n").map((s) => s.trim()).filter(Boolean),
      recommendationReason: recommendationReason || null,
    }]);

    const strategies = [...(access.project.strategies ?? []), created];

    return NextResponse.json({
      ...created,
      metrics: computeStrategyMetrics(created, access.project, strategies),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 }
    );
  }
}
