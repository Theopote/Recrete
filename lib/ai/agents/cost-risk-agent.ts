import type { DiagnosisItem, ProjectWithRelations, RenovationStrategy } from "@/types";
import type { AIInsight, CostRiskMatrix, EnergyRoiSummary, StrategyCostEstimate } from "@/types/ai";
import { COST_RISK_INSIGHT_SOURCE } from "@/types/ai";
import { runComplianceEngine } from "@/lib/ai/compliance";
import { resolveProjectMeasurements } from "@/lib/db/site-measurements-store";
import { analyzeEnergyPerformance } from "./energy-agent";
import { estimateProjectCost, prepareAndEstimateProjectCost, type CostEstimateResult } from "./cost-estimator-agent";
import { prepareCostEstimateContext } from "../knowledge/cost-knowledge-sync";
import {
  buildPhasingFromEstimate,
  complianceRiskFromReport,
  constructionRiskFromProject,
  costRiskFromEstimate,
  energyInsightConfidence,
  lifecycleCostScore,
  scheduleRiskFromStrategy,
} from "./cost-risk-scoring";

/** sourceType tag for insights persisted from Cost & Risk analysis */
export { COST_RISK_INSIGHT_SOURCE } from "@/types/ai";

function buildEnergyRoiSummary(
  project: ProjectWithRelations,
  strategies: RenovationStrategy[]
): EnergyRoiSummary {
  const analysis = analyzeEnergyPerformance(project);
  const energyStrategy = strategies.find((s) => s.type === "energy_retrofit");

  return {
    totalInvestment: analysis.roi.totalInvestment,
    annualEnergySavingsKwh: analysis.roi.annualEnergySavingsKwh,
    annualCostSavings: analysis.roi.annualCostSavings,
    simplePaybackYears: analysis.roi.simplePaybackYears,
    roiPercent10Year: analysis.roi.roiPercent10Year,
    currentEui: analysis.simulation.benchmarkComparison.currentEui,
    targetEui: analysis.simulation.benchmarkComparison.targetEui,
    rating: analysis.simulation.rating,
    recommendedMeasures: analysis.recommendedBundle.map((m) => ({
      nameZh: m.nameZh,
      savingsPercent: m.estimatedSavingsPercent,
    })),
    linkedStrategyId: energyStrategy?.id,
    linkedStrategyName: energyStrategy?.name,
  };
}

function toStrategyCostEstimate(
  strategy: RenovationStrategy,
  estimate: CostEstimateResult
): StrategyCostEstimate {
  return {
    strategyId: strategy.id,
    strategyName: strategy.name,
    estimatedCostPerSqm: estimate.estimatedCostPerSqm,
    estimatedCostPerSqmMin: estimate.estimatedCostPerSqmMin,
    estimatedCostPerSqmMax: estimate.estimatedCostPerSqmMax,
    estimatedTotalCost: estimate.estimatedTotalCost,
    costLevel: estimate.costLevel,
    confidence: estimate.confidence,
    referenceCaseCount: estimate.referenceCases.length,
    hasBenchmark: Boolean(estimate.benchmark),
  };
}

function buildCostInsight(
  strategy: RenovationStrategy,
  estimate: CostEstimateResult
): Omit<AIInsight, "id" | "projectId" | "createdAt" | "updatedAt"> {
  const evidenceParts = [
    estimate.provenance.dataSourceNote,
    estimate.benchmark
      ? `Benchmark ${estimate.benchmark.region} (n=${estimate.benchmark.sampleSize}, ${estimate.benchmark.updatedAt})`
      : null,
    estimate.provenance.projectActualRecordCount > 0
      ? `${estimate.provenance.projectActualRecordCount} project actual cost record(s)`
      : null,
    estimate.referenceCases.length > 0
      ? `Cases: ${estimate.referenceCases.map((item) => item.title).join("; ")}`
      : "No comparable cases — regional default applied",
  ].filter(Boolean);

  return {
    title: `Cost estimate — ${strategy.name}`,
    type: "cost_warning",
    priority: estimate.costLevel === "high" ? "high" : "medium",
    summary: `¥${estimate.estimatedCostPerSqm.toLocaleString()}/m² (total ¥${estimate.estimatedTotalCost.toLocaleString()}, range ¥${estimate.estimatedCostPerSqmMin.toLocaleString()}–¥${estimate.estimatedCostPerSqmMax.toLocaleString()}/m²).`,
    evidence: evidenceParts.join(" · "),
    recommendation:
      estimate.assumptions[0] ??
      "Validate quantities with a cost consultant before budget approval.",
    confidence: estimate.confidence,
    status: "open",
    sourceType: COST_RISK_INSIGHT_SOURCE,
    sourceId: strategy.id,
  };
}

function buildScheduleInsight(
  strategy: RenovationStrategy,
  estimate: CostEstimateResult,
  diagnosisItems: DiagnosisItem[]
): Omit<AIInsight, "id" | "projectId" | "createdAt" | "updatedAt"> {
  const criticalCount = diagnosisItems.filter((item) => item.severity === "critical").length;
  const scheduleRisk = scheduleRiskFromStrategy(strategy, estimate.confidence);

  return {
    title: `Schedule risk — ${strategy.name}`,
    type: "schedule_warning",
    priority: scheduleRisk >= 70 ? "high" : "medium",
    summary: `${strategy.scheduleLevel} schedule intensity; estimator confidence ${Math.round(estimate.confidence * 100)}%. ${criticalCount > 0 ? `${criticalCount} critical diagnosis items may extend permitting.` : "No critical blockers flagged in diagnosis."}`,
    evidence: `${diagnosisItems.length} diagnosis items; strategy type ${strategy.type}`,
    recommendation:
      criticalCount >= 2
        ? "Front-load structural and fire consultant engagement before construction procurement."
        : "Align procurement with WBS top packages and allow contingency for existing-building unknowns.",
    confidence: Math.min(0.88, estimate.confidence + 0.05),
    status: "open",
    sourceType: COST_RISK_INSIGHT_SOURCE,
    sourceId: strategy.id,
  };
}

function buildEnergyInsights(
  project: ProjectWithRelations,
  energyRoi: EnergyRoiSummary,
  strategies: RenovationStrategy[],
  hasMeasurementData: boolean
): Omit<AIInsight, "id" | "projectId" | "createdAt" | "updatedAt">[] {
  const energyStrategy = strategies.find((s) => s.type === "energy_retrofit");
  const insights: Omit<AIInsight, "id" | "projectId" | "createdAt" | "updatedAt">[] = [];
  const roiConfidence = energyInsightConfidence(energyRoi, hasMeasurementData);

  if (energyRoi.rating === "poor" || energyRoi.currentEui > energyRoi.targetEui * 1.15) {
    insights.push({
      title: "High baseline energy cost burden",
      type: "cost_warning",
      priority: "medium",
      summary: `Current EUI ${energyRoi.currentEui} kWh/m²·a exceeds benchmark (${energyRoi.targetEui}). Operating cost is a material lifecycle risk for ${project.name}.`,
      evidence: `Energy simulation — ${energyRoi.rating} performance rating`,
      recommendation: "Prioritize envelope-first retrofit or bundle with energy_retrofit strategy.",
      confidence: Math.max(0.62, roiConfidence - 0.04),
      status: "open",
      sourceType: COST_RISK_INSIGHT_SOURCE,
    });
  }

  insights.push({
    title: "Energy retrofit ROI opportunity",
    type: "opportunity",
    priority: energyRoi.simplePaybackYears <= 10 ? "high" : "medium",
    summary: `Recommended bundle: invest ¥${energyRoi.totalInvestment.toLocaleString()}, save ¥${energyRoi.annualCostSavings.toLocaleString()}/year. Payback ~${energyRoi.simplePaybackYears} years; 10-year ROI ${energyRoi.roiPercent10Year}%.`,
    evidence: energyRoi.recommendedMeasures
      .map((item) => `${item.nameZh} (−${item.savingsPercent}%)`)
      .join("; "),
    recommendation: energyStrategy
      ? `Align capex with strategy "${energyStrategy.name}" and phase MEP/envelope works for grant eligibility.`
      : "Generate Green Energy Retrofit strategy in Strategy Lab to formalize scope.",
    confidence: roiConfidence,
    status: "open",
    sourceType: COST_RISK_INSIGHT_SOURCE,
    sourceId: energyStrategy?.id,
  });

  return insights;
}

export function buildCostRiskEnergyInsightDrafts(
  project: ProjectWithRelations,
  energyRoi: EnergyRoiSummary,
  strategies: RenovationStrategy[],
  hasMeasurementData = false
): Omit<AIInsight, "id" | "projectId" | "createdAt" | "updatedAt">[] {
  return buildEnergyInsights(project, energyRoi, strategies, hasMeasurementData);
}

/** ROI-adjusted lifecycle cost score for strategy comparison (lower = better) */
export function computeLifecycleCostScore(
  project: ProjectWithRelations,
  strategy: Pick<RenovationStrategy, "type" | "costLevel">,
  allStrategies?: RenovationStrategy[]
): number {
  const strategies = allStrategies ?? project.strategies ?? [];
  const energyRoi = buildEnergyRoiSummary(project, strategies);
  const estimate = estimateProjectCost(
    project,
    strategies.find((item) => item.type === strategy.type) ?? null,
    { strategyType: strategy.type }
  );
  const capexRisk = costRiskFromEstimate(estimate);
  return lifecycleCostScore(
    capexRisk,
    energyRoi.roiPercent10Year,
    energyRoi.simplePaybackYears,
    strategy.type
  );
}

function buildPhasingWithEnergy(
  basePhasing: string[],
  energyRoi: EnergyRoiSummary,
  strategies: RenovationStrategy[]
): string[] {
  const hasEnergyStrategy = strategies.some((item) => item.type === "energy_retrofit");
  if (!hasEnergyStrategy && energyRoi.rating === "good") {
    return basePhasing;
  }

  const energyPhase = `Phase — Energy retrofit (ROI ${energyRoi.roiPercent10Year}%, payback ${energyRoi.simplePaybackYears} yr): Envelope windows/insulation, VRF HVAC, LED controls — est. ¥${energyRoi.totalInvestment.toLocaleString()} capex, ¥${energyRoi.annualCostSavings.toLocaleString()}/yr savings`;

  const insertAt = Math.min(2, basePhasing.length);
  return [...basePhasing.slice(0, insertAt), energyPhase, ...basePhasing.slice(insertAt)];
}

export async function estimateCostAndRisk(
  project: ProjectWithRelations,
  strategy: RenovationStrategy,
  diagnosisItems: DiagnosisItem[],
  hasMeasurementData = false
): Promise<{
  costLevel: string;
  scheduleLevel: string;
  riskLevel: string;
  estimate: CostEstimateResult;
  insights: Omit<AIInsight, "id" | "projectId" | "createdAt" | "updatedAt">[];
}> {
  const estimate = await prepareAndEstimateProjectCost(project, strategy);
  const energyRoi = buildEnergyRoiSummary(project, [strategy]);
  const energyInsights =
    strategy.type === "energy_retrofit"
      ? buildEnergyInsights(project, energyRoi, [strategy], hasMeasurementData)
      : [];

  const criticalCount = diagnosisItems.filter((item) => item.severity === "critical").length;

  return {
    costLevel: estimate.costLevel,
    scheduleLevel: strategy.scheduleLevel,
    riskLevel: criticalCount >= 2 ? "high" : strategy.riskLevel,
    estimate,
    insights: [buildCostInsight(strategy, estimate), buildScheduleInsight(strategy, estimate, diagnosisItems), ...energyInsights],
  };
}

export async function generateRiskMatrix(
  project: ProjectWithRelations,
  strategies: RenovationStrategy[]
): Promise<CostRiskMatrix> {
  const measurements = await resolveProjectMeasurements(project.id);
  const hasMeasurementData = Object.keys(measurements).length > 0;
  const complianceReport = runComplianceEngine(project, { measurements });
  const complianceRisk = complianceRiskFromReport(complianceReport);
  const energyRoi = buildEnergyRoiSummary(project, strategies);
  const energyInsights = buildEnergyInsights(
    project,
    energyRoi,
    strategies,
    hasMeasurementData
  );

  const { snapshot, projectRecords } = await prepareCostEstimateContext(project.id);
  const costContext = { costKnowledge: snapshot, projectCostRecords: projectRecords };

  const strategyEstimates: StrategyCostEstimate[] = [];
  const costWarnings: CostRiskMatrix["costWarnings"] = [];
  const scheduleWarnings: CostRiskMatrix["scheduleWarnings"] = [];

  const rows = strategies.map((strategy) => {
    const estimate = estimateProjectCost(project, strategy, costContext);
    strategyEstimates.push(toStrategyCostEstimate(strategy, estimate));
    costWarnings.push(buildCostInsight(strategy, estimate));
    scheduleWarnings.push(
      buildScheduleInsight(strategy, estimate, project.diagnosis ?? [])
    );

    const capexRisk = costRiskFromEstimate(estimate);

    return {
      strategyId: strategy.id,
      strategyName: strategy.name,
      costRisk: capexRisk,
      scheduleRisk: scheduleRiskFromStrategy(strategy, estimate.confidence),
      constructionRisk: constructionRiskFromProject(project, strategy),
      complianceRisk,
      lifecycleCostScore: lifecycleCostScore(
        capexRisk,
        energyRoi.roiPercent10Year,
        energyRoi.simplePaybackYears,
        strategy.type
      ),
    };
  });

  const leadStrategy = strategies[0];
  const leadEstimate = leadStrategy
    ? estimateProjectCost(project, leadStrategy, costContext)
    : null;
  const phasingPlan = leadStrategy && leadEstimate
    ? buildPhasingWithEnergy(buildPhasingFromEstimate(leadStrategy, leadEstimate), energyRoi, strategies)
    : [];

  const dataSourceNote =
    leadEstimate?.provenance.dataSourceNote ??
    (strategyEstimates.some((item) => item.hasBenchmark)
      ? "Cost risks derived from regional benchmarks and comparable renovation cases."
      : "Cost risks derived from seed case library — validate with local QS before decisions.");

  return {
    strategies: rows,
    strategyEstimates,
    dataSourceNote,
    costWarnings: [...costWarnings, ...energyInsights.filter((item) => item.type === "cost_warning")],
    scheduleWarnings,
    phasingPlan,
    energyRoi,
    energyOpportunities: energyInsights.filter((item) => item.type === "opportunity"),
  };
}

export async function suggestPhasingPlan(
  project: ProjectWithRelations,
  strategy: RenovationStrategy
): Promise<string[]> {
  const energyRoi = buildEnergyRoiSummary(project, [strategy]);
  const estimate = await prepareAndEstimateProjectCost(project, strategy);
  return buildPhasingWithEnergy(
    buildPhasingFromEstimate(strategy, estimate),
    energyRoi,
    [strategy]
  );
}
