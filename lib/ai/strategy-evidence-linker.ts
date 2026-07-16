import type { DiagnosisItem, RenovationStrategy, StrategyType } from "@/types";
import type { SourceEvidence } from "@/types/ai";

export interface StrategySourceLinks {
  diagnosisIds: string[];
  evidenceIds: string[];
}

const STRATEGY_CATEGORY_FOCUS: Partial<Record<StrategyType, DiagnosisItem["category"][]>> = {
  light_renewal: ["facade", "energy", "mep", "accessibility"],
  medium_renovation: ["structure", "mep", "fire", "accessibility"],
  deep_recreation: ["structure", "fire", "mep", "heritage"],
  adaptive_reuse: ["structure", "fire", "mep", "heritage", "accessibility"],
  facade_upgrade: ["facade", "energy"],
  energy_retrofit: ["energy", "mep"],
  safety_upgrade: ["structure", "fire"],
};

function scoreDiagnosisForStrategy(
  item: DiagnosisItem,
  strategyType: StrategyType
): number {
  const focus = STRATEGY_CATEGORY_FOCUS[strategyType] ?? [];
  let score = 0;
  if (focus.includes(item.category)) score += 3;
  if (item.severity === "critical") score += 4;
  else if (item.severity === "high") score += 3;
  else if (item.severity === "medium") score += 1;
  if (item.requiresEngineerReview) score += 1;
  return score;
}

export function linkStrategyToSources(
  strategy: Pick<RenovationStrategy, "id" | "type">,
  diagnosis: DiagnosisItem[],
  evidence: SourceEvidence[],
  options?: { maxDiagnosis?: number; maxEvidence?: number }
): StrategySourceLinks {
  const maxDiagnosis = options?.maxDiagnosis ?? 5;
  const maxEvidence = options?.maxEvidence ?? 4;

  const diagnosisIds = [...diagnosis]
    .sort(
      (a, b) =>
        scoreDiagnosisForStrategy(b, strategy.type) -
        scoreDiagnosisForStrategy(a, strategy.type)
    )
    .filter((item) => scoreDiagnosisForStrategy(item, strategy.type) > 0)
    .slice(0, maxDiagnosis)
    .map((item) => item.id);

  const evidenceIds = [...evidence]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, maxEvidence)
    .map((item) => item.id);

  return { diagnosisIds, evidenceIds };
}

export function linkStrategiesToSources(
  strategies: RenovationStrategy[],
  diagnosis: DiagnosisItem[],
  evidence: SourceEvidence[]
): Map<string, StrategySourceLinks> {
  const map = new Map<string, StrategySourceLinks>();
  for (const strategy of strategies) {
    map.set(strategy.id, linkStrategyToSources(strategy, diagnosis, evidence));
  }
  return map;
}
