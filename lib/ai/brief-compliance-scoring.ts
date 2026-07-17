import type { RenovationStrategy } from "@/types";
import type { ProjectBriefFactWithSource } from "./project-brief-context";

export interface BriefConstraintCheck {
  factId: string;
  label: string;
  field: string;
  value: string;
  documentName: string;
  satisfied: boolean;
  matchReason?: string;
}

export interface BriefComplianceResult {
  score: number;
  checks: BriefConstraintCheck[];
  satisfied: number;
  total: number;
  gaps: string[];
}

const STRATEGY_TEXT_FIELDS: (keyof RenovationStrategy)[] = [
  "summary",
  "designGoal",
  "spatialStrategy",
  "structuralStrategy",
  "facadeStrategy",
  "mepStrategy",
];

function strategyFullText(strategy: RenovationStrategy): string {
  return STRATEGY_TEXT_FIELDS.map((k) => String(strategy[k] ?? ""))
    .concat(strategy.pros ?? [])
    .concat(strategy.cons ?? [])
    .join(" ")
    .toLowerCase();
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((w) => w.length > 2)
  );
}

function tokenOverlap(a: string, b: string): number {
  const ta = tokenize(a);
  const tb = tokenize(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let overlap = 0;
  for (const token of ta) {
    if (tb.has(token)) overlap += 1;
  }
  return overlap / Math.max(ta.size, 1);
}

function checkConstraintSatisfied(
  fact: ProjectBriefFactWithSource,
  fullText: string,
  strategy: RenovationStrategy
): { satisfied: boolean; reason?: string } {
  const needle = fact.value.toLowerCase();
  const labelLower = fact.label.toLowerCase();

  // Direct mention
  if (fullText.includes(needle.slice(0, 20))) {
    return { satisfied: true, reason: "Direct mention in strategy text" };
  }

  // Token overlap heuristic
  const overlap = tokenOverlap(fact.value, fullText);
  if (overlap >= 0.35) {
    return { satisfied: true, reason: `Token overlap ${Math.round(overlap * 100)}%` };
  }

  // Field-specific heuristics
  if (fact.field === "budget") {
    const budgetLevel = strategy.costLevel;
    if (/低|limited|low/i.test(fact.value) && budgetLevel === "low") {
      return { satisfied: true, reason: "Cost level aligned with budget constraint" };
    }
    if (/中|medium|moderate/i.test(fact.value) && (budgetLevel === "low" || budgetLevel === "medium")) {
      return { satisfied: true, reason: "Cost level within budget constraint" };
    }
  }

  if (fact.field === "schedule") {
    if (/短|fast|urgent/i.test(fact.value) && strategy.scheduleLevel === "low") {
      return { satisfied: true, reason: "Schedule level aligned with time constraint" };
    }
  }

  if (fact.field === "constraint") {
    if (/保留|preserve|retain/i.test(fact.value) && /preserv|保留|retain/i.test(fullText)) {
      return { satisfied: true, reason: "Preservation constraint addressed" };
    }
  }

  if (fact.field === "program" || fact.field === "objective") {
    const keywords = tokenize(fact.value);
    const stratTokens = tokenize(fullText);
    let hits = 0;
    for (const kw of keywords) {
      if (stratTokens.has(kw)) hits++;
    }
    if (hits >= 2) {
      return { satisfied: true, reason: `${hits} program keywords found in strategy` };
    }
  }

  // Check label mentions
  if (fullText.includes(labelLower)) {
    return { satisfied: true, reason: "Constraint label referenced" };
  }

  return { satisfied: false };
}

export function evaluateBriefCompliance(
  strategy: RenovationStrategy,
  briefFacts: ProjectBriefFactWithSource[]
): BriefComplianceResult {
  if (briefFacts.length === 0) {
    return { score: 100, checks: [], satisfied: 0, total: 0, gaps: [] };
  }

  const fullText = strategyFullText(strategy);
  const checks: BriefConstraintCheck[] = [];

  for (const fact of briefFacts) {
    const result = checkConstraintSatisfied(fact, fullText, strategy);
    checks.push({
      factId: fact.id,
      label: fact.label,
      field: fact.field,
      value: fact.value,
      documentName: fact.documentName,
      satisfied: result.satisfied,
      matchReason: result.reason,
    });
  }

  const satisfied = checks.filter((c) => c.satisfied).length;
  const total = checks.length;
  const score = total > 0 ? Math.round((satisfied / total) * 100) : 100;
  const gaps = checks
    .filter((c) => !c.satisfied)
    .map((c) => `${c.label}: ${c.value.slice(0, 80)}`);

  return { score, checks, satisfied, total, gaps };
}
