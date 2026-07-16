import { describe, it, expect } from "vitest";
import {
  costRiskFromEstimate,
  complianceRiskFromReport,
  insightConfidenceFromDiagnosis,
  executiveInsightConfidence,
  energyInsightConfidence,
} from "@/lib/ai/agents/cost-risk-scoring";
import type { CostEstimateResult } from "@/lib/ai/agents/cost-estimator-agent";
import type { DiagnosisItem } from "@/types";

function sampleEstimate(overrides: Partial<CostEstimateResult> = {}): CostEstimateResult {
  return {
    currency: "CNY",
    unit: "sqm",
    estimatedCostPerSqm: 2400,
    estimatedCostPerSqmMin: 1800,
    estimatedCostPerSqmMax: 3200,
    estimatedTotalCost: 30_720_000,
    costLevel: "medium",
    confidence: 0.82,
    referenceCases: [{ id: "case-1", title: "Demo case" }],
    breakdown: [],
    wbsItems: [],
    assumptions: ["Based on benchmark"],
    provenance: {
      materialPriceCount: 6,
      materialPriceSource: "seed",
      regionalMaterialTrendPercent: 1.2,
      benchmarkSource: "seed",
      projectActualRecordCount: 0,
      baselineSources: ["benchmark 西北"],
      dataSourceNote: "seed material price indices",
    },
    ...overrides,
  };
}

describe("cost-risk scoring", () => {
  it("maps higher unit costs and uncertainty to higher cost risk", () => {
    const low = costRiskFromEstimate(sampleEstimate({ costLevel: "low", estimatedCostPerSqm: 1200 }));
    const high = costRiskFromEstimate(
      sampleEstimate({
        costLevel: "high",
        estimatedCostPerSqm: 4600,
        estimatedCostPerSqmMin: 3800,
        estimatedCostPerSqmMax: 5600,
        confidence: 0.64,
      })
    );
    expect(high).toBeGreaterThan(low);
  });

  it("raises compliance risk when more checks fail verification", () => {
    const low = complianceRiskFromReport({
      summary: { total: 10, compliant: 8, nonCompliant: 0, requiresVerification: 2, byCategory: {} as never },
    } as never);
    const high = complianceRiskFromReport({
      summary: { total: 10, compliant: 2, nonCompliant: 5, requiresVerification: 3, byCategory: {} as never },
    } as never);
    expect(high).toBeGreaterThan(low);
  });

  it("scores diagnosis insight confidence from evidence and severity", () => {
    const sparse: DiagnosisItem = {
      id: "d1",
      projectId: "p1",
      title: "Minor issue",
      category: "architecture",
      severity: "low",
      status: "identified",
      description: "Minor",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const strong: DiagnosisItem = {
      ...sparse,
      id: "d2",
      severity: "critical",
      evidence: "GB 50016 §5.5.18 — required: ≥1.2m, actual: 1.0m (measured on site 2026-03-12)",
      recommendation: "Widen stair or add egress route per fire engineer review.",
    };

    expect(insightConfidenceFromDiagnosis(strong)).toBeGreaterThan(
      insightConfidenceFromDiagnosis(sparse)
    );
    expect(insightConfidenceFromDiagnosis(strong)).toBeLessThanOrEqual(0.9);
  });

  it("scores executive summary confidence from evidence coverage", () => {
    const now = new Date();
    const sparse: DiagnosisItem[] = [
      {
        id: "d1",
        projectId: "p1",
        title: "Minor",
        category: "architecture",
        severity: "low",
        status: "identified",
        description: "Minor",
        createdAt: now,
        updatedAt: now,
      },
    ];
    const rich: DiagnosisItem[] = [
      {
        ...sparse[0],
        id: "d2",
        severity: "critical",
        evidence: "GB 50016 §5.5.18 with site measurement",
      },
      {
        ...sparse[0],
        id: "d3",
        severity: "high",
        evidence: "Structural report section 4.2 — load test results",
      },
    ];

    expect(
      executiveInsightConfidence(rich, { langChainEnabled: true })
    ).toBeGreaterThan(executiveInsightConfidence(sparse));
  });

  it("raises energy insight confidence when site measurements exist", () => {
    const base = energyInsightConfidence({ rating: "average", simplePaybackYears: 12 }, false);
    const withData = energyInsightConfidence({ rating: "average", simplePaybackYears: 12 }, true);
    expect(withData).toBeGreaterThan(base);
  });
});
