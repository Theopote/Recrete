import { NextResponse } from "next/server";
import { addStrategies, getProjectById } from "@/lib/db/repository";
import { strategySchema } from "@/lib/validators/project";
import { computeStrategyMetrics } from "@/lib/utils/strategy-metrics";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
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

    const project = await getProjectById(projectId);
    const strategies = [...(project?.strategies ?? []), created];

    return NextResponse.json({
      ...created,
      metrics: computeStrategyMetrics(created, project, strategies),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 }
    );
  }
}
