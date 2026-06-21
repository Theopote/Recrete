import type { DiagnosisItem, ProjectWithRelations, RenovationStrategy } from "@/types";
import type { AIInsight, CostRiskMatrix, EnergyRoiSummary } from "@/types/ai";
import { COST_RISK_INSIGHT_SOURCE } from "@/types/ai";
import { analyzeEnergyPerformance } from "./energy-agent";
import { withMockDelay } from "../providers/utils";

const riskScore: Record<string, number> = { low: 25, medium: 55, high: 80, critical: 95 };

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

function lifecycleCostScore(
  capexRisk: number,
  energyRoi: EnergyRoiSummary,
  strategyType: string
): number {
  if (strategyType !== "energy_retrofit") {
    return capexRisk;
  }
  const roiBonus = Math.min(25, Math.round(energyRoi.roiPercent10Year / 8));
  const paybackBonus =
    energyRoi.simplePaybackYears <= 8 ? 15 : energyRoi.simplePaybackYears <= 12 ? 8 : 0;
  return Math.max(15, capexRisk - roiBonus - paybackBonus);
}

function buildEnergyInsights(
  project: ProjectWithRelations,
  energyRoi: EnergyRoiSummary,
  strategies: RenovationStrategy[]
): Omit<AIInsight, "id" | "projectId" | "createdAt" | "updatedAt">[] {
  const energyStrategy = strategies.find((s) => s.type === "energy_retrofit");
  const insights: Omit<AIInsight, "id" | "projectId" | "createdAt" | "updatedAt">[] = [];

  if (energyRoi.rating === "poor" || energyRoi.currentEui > energyRoi.targetEui * 1.15) {
    insights.push({
      title: "High baseline energy cost burden",
      type: "cost_warning",
      priority: "medium",
      summary: `Current EUI ${energyRoi.currentEui} kWh/m²·a exceeds benchmark (${energyRoi.targetEui}). Operating cost is a material lifecycle risk for ${project.name}.`,
      evidence: `Energy simulation — ${energyRoi.rating} performance rating`,
      recommendation: "Prioritize envelope-first retrofit or bundle with energy_retrofit strategy.",
      confidence: 0.84,
      status: "open",
      sourceType: COST_RISK_INSIGHT_SOURCE,
    });
  }

  insights.push({
    title: "Energy retrofit ROI opportunity",
    type: "opportunity",
    priority: energyRoi.simplePaybackYears <= 10 ? "high" : "medium",
    summary: `Recommended bundle: invest ¥${energyRoi.totalInvestment.toLocaleString()}, save ¥${energyRoi.annualCostSavings.toLocaleString()}/year. Payback ~${energyRoi.simplePaybackYears} years; 10-year ROI ${energyRoi.roiPercent10Year}%.`,
    evidence: energyRoi.recommendedMeasures.map((m) => `${m.nameZh} (−${m.savingsPercent}%)`).join("; "),
    recommendation: energyStrategy
      ? `Align capex with strategy "${energyStrategy.name}" and phase MEP/envelope works for grant eligibility.`
      : "Generate Green Energy Retrofit strategy in Strategy Lab to formalize scope.",
    confidence: 0.81,
    status: "open",
    sourceType: COST_RISK_INSIGHT_SOURCE,
    sourceId: energyStrategy?.id,
  });

  return insights;
}

export function buildCostRiskEnergyInsightDrafts(
  project: ProjectWithRelations,
  energyRoi: EnergyRoiSummary,
  strategies: RenovationStrategy[]
): Omit<AIInsight, "id" | "projectId" | "createdAt" | "updatedAt">[] {
  return buildEnergyInsights(project, energyRoi, strategies);
}

/** ROI-adjusted lifecycle cost score for strategy comparison (lower = better) */
export function computeLifecycleCostScore(
  project: ProjectWithRelations,
  strategy: Pick<RenovationStrategy, "type" | "costLevel">,
  allStrategies?: RenovationStrategy[]
): number {
  const strategies = allStrategies ?? project.strategies ?? [];
  const energyRoi = buildEnergyRoiSummary(project, strategies);
  const costRisk = riskScore[strategy.costLevel] ?? 50;
  return lifecycleCostScore(costRisk, energyRoi, strategy.type);
}

function buildPhasingWithEnergy(
  basePhasing: string[],
  energyRoi: EnergyRoiSummary,
  strategies: RenovationStrategy[]
): string[] {
  const hasEnergyStrategy = strategies.some((s) => s.type === "energy_retrofit");
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
  diagnosisItems: DiagnosisItem[]
): Promise<{
  costLevel: string;
  scheduleLevel: string;
  riskLevel: string;
  insights: Omit<AIInsight, "id" | "projectId" | "createdAt" | "updatedAt">[];
}> {
  return withMockDelay(() => {
    const criticalCount = diagnosisItems.filter((d) => d.severity === "critical").length;
    const energyRoi = buildEnergyRoiSummary(project, [strategy]);
    const energyInsights =
      strategy.type === "energy_retrofit" ? buildEnergyInsights(project, energyRoi, [strategy]) : [];

    return {
      costLevel: strategy.costLevel,
      scheduleLevel: strategy.scheduleLevel,
      riskLevel: criticalCount >= 2 ? "high" : strategy.riskLevel,
      insights: [
        {
          title: `Cost profile for ${strategy.name}`,
          type: "cost_warning",
          priority: strategy.costLevel === "high" ? "high" : "medium",
          summary: `Estimated ${strategy.costLevel} cost level for ${project.name}. MEP replacement is primary cost driver.`,
          evidence: `${diagnosisItems.length} diagnosis items; strategy type: ${strategy.type}`,
          recommendation: "Develop phased budget with 15% contingency for existing building unknowns.",
          confidence: 0.79,
          status: "open",
          sourceType: "strategy",
          sourceId: strategy.id,
        },
        {
          title: `Schedule risk for ${strategy.name}`,
          type: "schedule_warning",
          priority: strategy.scheduleLevel === "high" ? "high" : "medium",
          summary: `${strategy.scheduleLevel} schedule intensity. Permit and occupancy change reviews may add 2–4 months.`,
          evidence: "Comparable adaptive reuse projects in China",
          recommendation: "Front-load survey and code consultant engagement.",
          confidence: 0.76,
          status: "open",
          sourceType: "strategy",
          sourceId: strategy.id,
        },
        ...energyInsights,
      ],
    };
  }, 1000);
}

export async function generateRiskMatrix(
  project: ProjectWithRelations,
  strategies: RenovationStrategy[]
): Promise<CostRiskMatrix> {
  return withMockDelay(() => {
    const energyRoi = buildEnergyRoiSummary(project, strategies);
    const energyInsights = buildEnergyInsights(project, energyRoi, strategies);

    const costWarnings = energyInsights.filter((i) => i.type === "cost_warning");
    const energyOpportunities = energyInsights.filter((i) => i.type === "opportunity");

    const basePhasing = [
      "Phase 1: Safety stabilization — facade netting, roof temporary waterproofing, hazardous materials survey",
      "Phase 2: Code compliance — fire egress, accessibility, structural verification",
      "Phase 3: MEP replacement and envelope upgrade",
      "Phase 4: Interior fit-out for cultural program",
    ];

    return {
      strategies: strategies.map((s) => {
        const costRisk = riskScore[s.costLevel] ?? 50;
        return {
          strategyId: s.id,
          strategyName: s.name,
          costRisk,
          scheduleRisk: riskScore[s.scheduleLevel] ?? 50,
          constructionRisk: riskScore[s.riskLevel] ?? 50,
          complianceRisk: project.status === "diagnosis" ? 70 : 45,
          lifecycleCostScore: lifecycleCostScore(costRisk, energyRoi, s.type),
        };
      }),
      costWarnings: costWarnings as Omit<AIInsight, "id" | "projectId" | "createdAt" | "updatedAt">[],
      scheduleWarnings: [],
      phasingPlan: buildPhasingWithEnergy(basePhasing, energyRoi, strategies),
      energyRoi,
      energyOpportunities: energyOpportunities as Omit<
        AIInsight,
        "id" | "projectId" | "createdAt" | "updatedAt"
      >[],
    };
  }, 900);
}

export async function suggestPhasingPlan(
  project: ProjectWithRelations,
  strategy: RenovationStrategy
): Promise<string[]> {
  return withMockDelay(() => {
    const energyRoi = buildEnergyRoiSummary(project, [strategy]);
    const base = [
      `Phase 1 — Safety & survey (8–12 weeks): Address urgent site issues before ${strategy.name} construction`,
      "Phase 2 — Structure & egress (12–16 weeks): Structural repairs, stair/elevator upgrades",
      "Phase 3 — MEP & envelope (16–24 weeks): Full systems replacement per strategy",
      "Phase 4 — Fit-out & commissioning (12–16 weeks): Cultural program interior works",
    ];
    return buildPhasingWithEnergy(base, energyRoi, [strategy]);
  }, 600);
}
