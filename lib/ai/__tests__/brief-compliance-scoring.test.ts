import { describe, it, expect } from "vitest";
import { evaluateBriefCompliance } from "@/lib/ai/brief-compliance-scoring";
import type { RenovationStrategy } from "@/types";
import type { ProjectBriefFactWithSource } from "@/lib/ai/project-brief-context";

describe("evaluateBriefCompliance", () => {
  const baseStrategy: RenovationStrategy = {
    id: "s1",
    projectId: "p1",
    name: "Test Strategy",
    type: "medium_renovation",
    summary: "保留原有结构，增加节能围护系统",
    designGoal: "Preserve historic facade while improving energy efficiency",
    spatialStrategy: "Reorganize interior layout for modern use",
    structuralStrategy: "Strengthen existing columns",
    facadeStrategy: "Retain original facade, add insulation",
    mepStrategy: "Full HVAC upgrade",
    costLevel: "medium",
    scheduleLevel: "medium",
    riskLevel: "medium",
    pros: ["Preserves heritage value", "Good energy performance"],
    cons: ["Higher cost than light renewal"],
    linkedDiagnosisIds: [],
    linkedEvidenceIds: [],
    recommendationReason: null,
    feasibilityScore: undefined,
    designValueScore: undefined,
    preservationScore: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const briefFacts: ProjectBriefFactWithSource[] = [
    {
      id: "f1",
      label: "Preserve facade",
      field: "constraint",
      value: "保留原有立面风貌",
      documentId: "d1",
      documentName: "任务书v1.pdf",
    },
    {
      id: "f2",
      label: "Energy target",
      field: "metric",
      value: "节能率达到 65%",
      documentId: "d1",
      documentName: "任务书v1.pdf",
    },
    {
      id: "f3",
      label: "Parking requirement",
      field: "program",
      value: "新增地下停车场 200 个车位",
      documentId: "d1",
      documentName: "任务书v1.pdf",
    },
  ];

  it("returns 100% when no facts", () => {
    const result = evaluateBriefCompliance(baseStrategy, []);
    expect(result.score).toBe(100);
    expect(result.total).toBe(0);
  });

  it("detects satisfied and unsatisfied constraints", () => {
    const result = evaluateBriefCompliance(baseStrategy, briefFacts);
    expect(result.total).toBe(3);
    // "preserve" and "节能" should match; parking likely won't
    expect(result.satisfied).toBeGreaterThanOrEqual(1);
    expect(result.gaps.length).toBeGreaterThanOrEqual(1);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(100);
  });

  it("marks constraint satisfied on direct text overlap", () => {
    const result = evaluateBriefCompliance(baseStrategy, [briefFacts[0]]);
    const check = result.checks[0];
    // "保留" appears in strategy summary and facadeStrategy
    expect(check.satisfied).toBe(true);
  });
});
