import type { DiagnosisItem, ProjectWithRelations, RenovationStrategy } from "@/types";
import type { AIInsight, CostRiskMatrix } from "@/types/ai";
import { withMockDelay } from "../providers/utils";

const riskScore: Record<string, number> = { low: 25, medium: 55, high: 80, critical: 95 };

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
      ],
    };
  }, 1000);
}

export async function generateRiskMatrix(
  project: ProjectWithRelations,
  strategies: RenovationStrategy[]
): Promise<CostRiskMatrix> {
  return withMockDelay(() => ({
    strategies: strategies.map((s) => ({
      strategyId: s.id,
      strategyName: s.name,
      costRisk: riskScore[s.costLevel] ?? 50,
      scheduleRisk: riskScore[s.scheduleLevel] ?? 50,
      constructionRisk: riskScore[s.riskLevel] ?? 50,
      complianceRisk: project.status === "diagnosis" ? 70 : 45,
    })),
    costWarnings: [],
    scheduleWarnings: [],
    phasingPlan: [
      "Phase 1: Safety stabilization — facade netting, roof temporary waterproofing, hazardous materials survey",
      "Phase 2: Code compliance — fire egress, accessibility, structural verification",
      "Phase 3: MEP replacement and envelope upgrade",
      "Phase 4: Interior fit-out for cultural program",
    ],
  }), 900);
}

export async function suggestPhasingPlan(
  _project: ProjectWithRelations,
  strategy: RenovationStrategy
): Promise<string[]> {
  return withMockDelay(
    () => [
      `Phase 1 — Safety & survey (8–12 weeks): Address urgent site issues before ${strategy.name} construction`,
      "Phase 2 — Structure & egress (12–16 weeks): Structural repairs, stair/elevator upgrades",
      "Phase 3 — MEP & envelope (16–24 weeks): Full systems replacement per strategy",
      "Phase 4 — Fit-out & commissioning (12–16 weeks): Cultural program interior works",
    ],
    600
  );
}
