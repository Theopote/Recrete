import type { ProjectWithRelations } from "@/types";
import type { BuildingCode } from "@/lib/ai/knowledge/code-database";
import { getCodesForScenario } from "@/lib/ai/knowledge/code-database";
import { resolveClimateZone } from "./climate-zones";
import { resolveComplianceScenarios } from "./scenario-resolver";
import {
  COMPLIANCE_ENGINE_VERSION,
  getRulesForScenarios,
  getComplianceChecklist,
} from "./rules";
import type {
  ComplianceCategory,
  ComplianceCheck,
  ComplianceEngineOptions,
  ComplianceEngineReport,
  ComplianceMeasurements,
  ComplianceContext,
  ComplianceRuleDefinition,
  OverallCompliance,
} from "./types";

export { COMPLIANCE_ENGINE_VERSION, getComplianceChecklist };

function buildContext(
  project: ProjectWithRelations,
  measurements: ComplianceMeasurements = {}
): ComplianceContext {
  const scenarios = resolveComplianceScenarios(project);
  const applicableCodes = scenarios
    .flatMap((s) => getCodesForScenario(s))
    .filter((code, index, self) => self.findIndex((c) => c.id === code.id) === index);

  return {
    project,
    measurements,
    scenarios,
    climateZone: resolveClimateZone(project.location),
    applicableCodes,
  };
}

function ruleApplies(rule: ComplianceRuleDefinition, ctx: ComplianceContext): boolean {
  const scenarioMatch = rule.scenarios.some(
    (s) => ctx.scenarios.includes(s) || s === "all"
  );
  if (!scenarioMatch) return false;
  if (rule.applies && !rule.applies(ctx)) return false;
  return true;
}

function evaluateRule(
  rule: ComplianceRuleDefinition,
  ctx: ComplianceContext
): ComplianceCheck {
  const result = rule.evaluate(ctx);
  return {
    ruleId: rule.id,
    category: rule.category,
    code: rule.codeRef,
    codeId: rule.codeId,
    section: rule.section,
    requirement: rule.requirement,
    requirementZh: rule.requirementZh,
    status: result.status,
    actualValue: result.actualValue,
    requiredValue: result.requiredValue,
    note: result.note,
    noteZh: result.noteZh,
    priority: rule.priority,
    remediation: result.remediation,
  };
}

function deriveOverallCompliance(checks: ComplianceCheck[]): OverallCompliance {
  const nonCompliant = checks.filter((c) => c.status === "non_compliant");
  const criticalNonCompliant = nonCompliant.filter((c) => c.priority === "critical");

  if (criticalNonCompliant.length > 0 || nonCompliant.length >= 3) {
    return "non_compliant";
  }
  if (nonCompliant.length > 0) {
    return "partial";
  }
  return "compliant";
}

function buildSummary(checks: ComplianceCheck[]) {
  const byCategory = {} as Record<ComplianceCategory, number>;
  for (const check of checks) {
    byCategory[check.category] = (byCategory[check.category] ?? 0) + 1;
  }

  return {
    total: checks.length,
    compliant: checks.filter((c) => c.status === "compliant").length,
    nonCompliant: checks.filter((c) => c.status === "non_compliant").length,
    requiresVerification: checks.filter((c) => c.status === "requires_verification").length,
    byCategory,
  };
}

function buildRecommendations(checks: ComplianceCheck[], ctx: ComplianceContext): string[] {
  const recommendations = new Set<string>();

  for (const check of checks) {
    if (check.remediation) {
      recommendations.add(check.remediation);
    }
  }

  if (checks.some((c) => c.ruleId === "evacuation-stair-width" && c.status === "requires_verification")) {
    recommendations.add("Measure all evacuation stairways to verify code compliance");
  }

  if (ctx.project.constructionYear < 2010) {
    recommendations.add("Review seismic code compliance — building predates GB 50011-2010");
  }

  recommendations.add("Engage licensed professionals for final code compliance review");
  recommendations.add("Submit design to local authorities for approval before construction");

  return [...recommendations];
}

function buildCriticalIssues(checks: ComplianceCheck[]): string[] {
  return checks
    .filter((c) => c.status === "non_compliant" && (c.priority === "critical" || c.priority === "high"))
    .map((c) => `${c.requirement}: ${c.note}`);
}

export function runComplianceEngine(
  project: ProjectWithRelations,
  options: ComplianceEngineOptions = {}
): ComplianceEngineReport {
  const ctx = buildContext(project, options.measurements ?? {});
  const rules = getRulesForScenarios(ctx.scenarios);
  const checks: ComplianceCheck[] = [];

  for (const rule of rules) {
    if (!ruleApplies(rule, ctx)) continue;
    const check = evaluateRule(rule, ctx);
    if (check.status === "not_applicable" && !options.includeNotApplicable) continue;
    checks.push(check);
  }

  const criticalIssues = buildCriticalIssues(checks);
  const recommendations = buildRecommendations(checks, ctx);

  return {
    engineVersion: COMPLIANCE_ENGINE_VERSION,
    evaluatedAt: new Date().toISOString(),
    overallCompliance: deriveOverallCompliance(checks),
    scenarios: ctx.scenarios,
    climateZone: ctx.climateZone,
    applicableCodes: ctx.applicableCodes,
    checks,
    criticalIssues,
    recommendations,
    summary: buildSummary(checks),
  };
}

export function getApplicableCodesForProject(project: ProjectWithRelations): BuildingCode[] {
  return buildContext(project).applicableCodes;
}

export function getScenariosForProject(project: ProjectWithRelations): string[] {
  return resolveComplianceScenarios(project);
}
