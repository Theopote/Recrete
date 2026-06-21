import { NextResponse } from "next/server";
import { getProjectById, replaceInsightsBySourceType, addAnalysisRun } from "@/lib/db/repository";
import { getAIPlatform } from "@/lib/ai";
import type { AIInsight } from "@/types/ai";
import { COST_RISK_INSIGHT_SOURCE } from "@/types/ai";
type InsightDraft = Omit<AIInsight, "id" | "projectId" | "createdAt" | "updatedAt">;

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

  const insightDrafts: InsightDraft[] = [
    ...(matrix.costWarnings ?? []),
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
    modelName: "recrete-cost-risk-v1",
    confidence: 0.85,
  });

  return NextResponse.json({ matrix, phasingPlan, insights });
}
