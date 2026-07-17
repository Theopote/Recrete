import type { ComplianceEngineReport } from "@/lib/ai/compliance/types";
import type { CostEstimateResult } from "./cost-estimator-agent";
import type { DiagnosisItem, RenovationStrategy } from "@/types";
import type { ProjectWithRelations } from "@/types";

const levelRiskScore: Record<string, number> = {
  low: 25,
  medium: 55,
  high: 80,
  critical: 95,
};

export function costRiskFromEstimate(estimate: CostEstimateResult): number {
  const mid = estimate.estimatedCostPerSqm;
  const spread = Math.max(0, estimate.estimatedCostPerSqmMax - estimate.estimatedCostPerSqmMin);
  const volatility = mid > 0 ? spread / mid : 0.2;
  let base =
    estimate.costLevel === "high" ? 78 : estimate.costLevel === "medium" ? 55 : 30;
  base += Math.round(volatility * 18);
  if (estimate.confidence < 0.7) base += 8;
  return Math.min(95, Math.max(15, base));
}

export function scheduleRiskFromStrategy(
  strategy: RenovationStrategy,
  estimateConfidence: number
): number {
  const base = levelRiskScore[strategy.scheduleLevel] ?? 50;
  const uncertainty =
    estimateConfidence < 0.68 ? 14 : estimateConfidence < 0.78 ? 8 : estimateConfidence < 0.85 ? 4 : 0;
  return Math.min(95, base + uncertainty);
}

export function constructionRiskFromProject(
  project: ProjectWithRelations,
  strategy: RenovationStrategy
): number {
  const diagnosis = project.diagnosis ?? [];
  const critical = diagnosis.filter((item) => item.severity === "critical").length;
  const high = diagnosis.filter((item) => item.severity === "high").length;
  const base = levelRiskScore[strategy.riskLevel] ?? 50;
  return Math.min(95, base + critical * 8 + high * 4);
}

export function complianceRiskFromReport(report: ComplianceEngineReport): number {
  const { total, nonCompliant, requiresVerification } = report.summary;
  if (total === 0) return 50;
  const failRatio = nonCompliant / total;
  const verifyRatio = requiresVerification / total;
  return Math.round(30 + failRatio * 45 + verifyRatio * 25);
}

export function lifecycleCostScore(
  capexRisk: number,
  roiPercent10Year: number,
  simplePaybackYears: number,
  strategyType: string
): number {
  if (strategyType !== "energy_retrofit") {
    return capexRisk;
  }
  const roiBonus = Math.min(25, Math.round(roiPercent10Year / 8));
  const paybackBonus =
    simplePaybackYears <= 8 ? 15 : simplePaybackYears <= 12 ? 8 : 0;
  return Math.max(15, capexRisk - roiBonus - paybackBonus);
}

export function buildPhasingFromEstimate(
  strategy: RenovationStrategy,
  estimate: CostEstimateResult
): string[] {
  const topItems = [...estimate.wbsItems]
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, 4);

  if (topItems.length === 0) {
    return [
      `Phase 1 — Survey & safety (${strategy.name})`,
      "Phase 2 — Structure & compliance upgrades",
      "Phase 3 — MEP and envelope works",
      "Phase 4 — Interior fit-out and commissioning",
    ];
  }

  return topItems.map(
    (item, index) =>
      `Phase ${index + 1} — ${item.nameZh}: ¥${item.totalCost.toLocaleString()} (${item.sharePercent}% of capex)`
  );
}

export function insightConfidenceFromDiagnosis(item: DiagnosisItem | undefined): number {
  if (!item) return 0.62;
  let score = 0.58;
  const evidence = item.evidence?.trim();
  if (evidence && evidence.length > 40) score += 0.16;
  else if (evidence && evidence.length > 12) score += 0.08;
  if (item.severity === "critical") score += 0.12;
  else if (item.severity === "high") score += 0.08;
  else if (item.severity === "medium") score += 0.04;
  if (item.recommendation && item.recommendation.length > 24) score += 0.04;
  return Math.min(0.9, Math.round(score * 100) / 100);
}

export function executiveInsightConfidence(
  diagnosisItems: DiagnosisItem[],
  options?: { expertSummary?: string | null; aiEnriched?: boolean }
): number {
  if (diagnosisItems.length === 0) return 0.55;

  const withEvidence = diagnosisItems.filter(
    (item) => item.evidence && item.evidence.trim().length > 20
  ).length;
  const evidenceRatio = withEvidence / diagnosisItems.length;
  const critical = diagnosisItems.filter((item) => item.severity === "critical").length;
  const high = diagnosisItems.filter((item) => item.severity === "high").length;

  let score = 0.52 + evidenceRatio * 0.25;
  if (critical > 0) score += 0.06;
  if (high > 0) score += 0.04;
  if (options?.expertSummary && options.expertSummary.trim().length > 80) score += 0.05;
  if (options?.aiEnriched) score += 0.04;

  return Math.min(0.92, Math.round(score * 100) / 100);
}

export function energyInsightConfidence(
  energyRoi: { rating: string; simplePaybackYears: number },
  hasMeasurementData: boolean
): number {
  let score = energyRoi.rating === "poor" ? 0.68 : 0.64;
  if (hasMeasurementData) score += 0.1;
  if (energyRoi.simplePaybackYears <= 10) score += 0.05;
  return Math.min(0.86, Math.round(score * 100) / 100);
}
