import { fireRules } from "./fire-rules";
import { accessibilityRules } from "./accessibility-rules";
import { energyRules } from "./energy-rules";
import { heritageRules } from "./heritage-rules";
import { structureRules } from "./structure-rules";
import { generalRules } from "./general-rules";
import { elevatorRules } from "./elevator-rules";
import type { ComplianceCategory, ComplianceRuleDefinition } from "../types";

export const COMPLIANCE_ENGINE_VERSION = "1.0.0";

export const allComplianceRules: ComplianceRuleDefinition[] = [
  ...fireRules,
  ...accessibilityRules,
  ...energyRules,
  ...heritageRules,
  ...structureRules,
  ...generalRules,
  ...elevatorRules,
];

export function getRulesForScenarios(scenarios: string[]): ComplianceRuleDefinition[] {
  const scenarioSet = new Set(scenarios);
  return allComplianceRules.filter((rule) =>
    rule.scenarios.some((s) => scenarioSet.has(s) || s === "all")
  );
}

export function getRulesByCategory(category: ComplianceCategory): ComplianceRuleDefinition[] {
  return allComplianceRules.filter((r) => r.category === category);
}

export function getComplianceChecklist(area: ComplianceCategory): string[] {
  return getRulesByCategory(area).map(
    (r) => `${r.requirementZh} (${r.codeRef} §${r.section})`
  );
}
