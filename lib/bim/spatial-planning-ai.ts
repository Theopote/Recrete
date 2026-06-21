import "server-only";

import { runSpatialPlanningChain } from "@/lib/ai/langchain/chains";
import type { BimSpatialAnalytics } from "@/types/bim";

export async function enrichSpatialAnalyticsWithAi(
  analytics: BimSpatialAnalytics,
  targetFunction: string
): Promise<BimSpatialAnalytics> {
  if (!analytics.layout || !analytics.flow) return analytics;

  const layoutSummary = `Overall score ${analytics.layout.overallScore}%. Top assignments: ${analytics.layout.assignments
    .slice(0, 3)
    .map((a) => `${a.roomLabel}→${a.assignedFunctionZh}`)
    .join(", ")}. Suggestions: ${analytics.layout.suggestions.join("; ")}`;

  const flowSummary = `Peak occupancy ~${analytics.flow.peakOccupancyEstimate}, ${analytics.flow.bottleneckCount} bottlenecks. ${analytics.flow.recommendations.join("; ")}`;

  const planningAdvice = await runSpatialPlanningChain({
    targetFunction,
    layoutSummary,
    flowSummary,
  });

  return { ...analytics, planningAdvice };
}
