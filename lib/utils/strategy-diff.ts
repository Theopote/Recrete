import type { RenovationStrategy } from "@/types";

const TRACKED_FIELDS = [
  "name",
  "summary",
  "designGoal",
  "spatialStrategy",
  "structuralStrategy",
  "facadeStrategy",
  "mepStrategy",
  "costLevel",
  "scheduleLevel",
  "riskLevel",
] as const;

export type StrategyDiffField = (typeof TRACKED_FIELDS)[number];

export interface StrategyFieldDiff {
  field: StrategyDiffField;
  before: string;
  after: string;
}

export function diffStrategySnapshots(
  before: RenovationStrategy,
  after: RenovationStrategy
): StrategyFieldDiff[] {
  return TRACKED_FIELDS.filter((field) => before[field] !== after[field]).map((field) => ({
    field,
    before: String(before[field]),
    after: String(after[field]),
  }));
}

export function summarizeStrategyDiff(diffs: StrategyFieldDiff[]): string {
  if (diffs.length === 0) return "No tracked field changes.";
  return diffs.map((d) => `${d.field}: updated`).join("; ");
}
