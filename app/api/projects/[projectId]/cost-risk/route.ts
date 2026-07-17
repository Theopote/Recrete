import { NextResponse } from "next/server";
import { replaceInsightsBySourceType, addAnalysisRun } from "@/lib/db/repository";
import { getAIPlatform } from "@/lib/ai";
import type { AIInsight } from "@/types/ai";
import { COST_RISK_INSIGHT_SOURCE } from "@/types/ai";
import { requireProjectAccess } from "@/lib/auth/authorize";
import { prepareCostEstimateContext, fetchMarketCostWebNote } from "@/lib/ai/knowledge/cost-knowledge-sync.server";
import { inferRegion } from "@/lib/ai/knowledge/prompt-context";
type InsightDraft = Omit<AIInsight, "id" | "projectId" | "createdAt" | "updatedAt">;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;
  const { project } = access;

  const strategies = project.strategies ?? [];
  const platform = getAIPlatform();
  const { snapshot, projectRecords } = await prepareCostEstimateContext(projectId);
  const region = inferRegion(project.location);
  const webMarketNote = await fetchMarketCostWebNote({
    region,
    buildingType: project.buildingType,
    strategyType: strategies[0]?.type,
  });
  const costContext = {
    costKnowledge: snapshot,
    projectCostRecords: projectRecords,
    webMarketNote,
  };
  const matrix = await platform.costRisk.generateRiskMatrix(project, strategies, costContext);
  const phasingPlan =
    strategies.length > 0
      ? await platform.costRisk.suggestPhasingPlan(project, strategies[0], costContext)
      : matrix.phasingPlan;
  const insightDrafts: InsightDraft[] = [
    ...(matrix.costWarnings ?? []),
    ...(matrix.scheduleWarnings ?? []),
    ...(matrix.energyOpportunities ?? []),
  ].map((draft) => ({
    title: draft.title,
    type: draft.type,
    priority: draft.priority,
    summary: draft.summary,
    evidence: draft.evidence,
    recommendation: draft.recommendation,
    confidence: draft.confidence,
    status: draft.status,
    sourceType: COST_RISK_INSIGHT_SOURCE,
    sourceId: draft.sourceId,
  }));

  const insights = await replaceInsightsBySourceType(
    projectId,
    COST_RISK_INSIGHT_SOURCE,
    insightDrafts
  );

  await addAnalysisRun({
    projectId,
    analysisType: "cost_risk_estimation",
    inputSummary: `Cost & risk — ${strategies.length} strategies, energy EUI ${matrix.energyRoi?.currentEui ?? "n/a"}`,
    outputSummary: `Persisted ${insights.length} cost/ROI insights; lifecycle scores computed`,
    generatedItemCount: insights.length,
    modelName: "recrete-cost-estimator-v1",
    confidence:
      matrix.strategyEstimates && matrix.strategyEstimates.length > 0
        ? matrix.strategyEstimates.reduce((sum, item) => sum + item.confidence, 0) /
          matrix.strategyEstimates.length
        : 0.75,
  });

  return NextResponse.json({
    matrix,
    phasingPlan,
    insights,
    strategyEstimates: matrix.strategyEstimates,
    dataSourceNote: matrix.dataSourceNote,
  });
}
