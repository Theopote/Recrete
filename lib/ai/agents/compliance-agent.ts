import type { DiagnosisItem, DiagnosisCategory, ProjectWithRelations } from "@/types";
import { bilingualKey, pickBilingual, type BilingualString } from "@/lib/i18n/bilingual";
import type { AppLocale } from "@/lib/i18n/locale";
import {
  searchCodes,
  type BuildingCode,
  type CodeRequirement,
} from "../knowledge/code-database";
import {
  runComplianceEngine,
  getComplianceChecklist,
  type ComplianceMeasurements,
  type ComplianceEngineReport,
  type ComplianceCategory,
  type ComplianceCheck,
} from "../compliance";

/**
 * Compliance Review Agent — delegates rule evaluation to the compliance engine.
 */
export class ComplianceAgent {
  async performComplianceCheck(
    project: ProjectWithRelations,
    context?: ComplianceMeasurements
  ): Promise<ComplianceEngineReport> {
    return runComplianceEngine(project, { measurements: context });
  }

  async generateComplianceDiagnosis(
    project: ProjectWithRelations,
    context?: ComplianceMeasurements,
    locale: AppLocale = "zh"
  ): Promise<Omit<DiagnosisItem, "id" | "projectId" | "createdAt" | "updatedAt">[]> {
    const result = await this.performComplianceCheck(project, context);

    return result.checks
      .filter((check) => check.status !== "compliant" && check.status !== "not_applicable")
      .map((check) => ({
        title: locale === "zh" ? check.requirementZh : check.requirement,
        category: mapComplianceCategory(check.category),
        severity:
          check.priority === "critical"
            ? "critical"
            : check.priority === "high"
              ? "high"
              : check.priority === "medium"
                ? "medium"
                : "low",
        status: "identified" as const,
        description: locale === "zh" ? check.noteZh : check.note,
        evidence: `${check.code} §${check.section} — required: ${check.requiredValue}${
          check.actualValue ? `, actual: ${check.actualValue}` : ""
        }`,
        recommendation:
          pickRemediationText(check.remediation, result.recommendations, check.category, locale) ??
          (locale === "zh"
            ? "现场核实并委托注册专业人员进行确认。"
            : "Verify on site and engage licensed professional for confirmation."),
        relatedLocation:
          check.category === "fire"
            ? locale === "zh"
              ? "疏散通道与防火分区"
              : "Egress and fire compartments"
            : undefined,
        requiresEngineerReview: check.category === "fire" || check.category === "structure",
      }));
  }

  searchCodeRequirements(keyword: string): Array<{
    code: BuildingCode;
    requirement: CodeRequirement;
    relevance: string;
  }> {
    const results = searchCodes(keyword);
    return results.map((r) => ({
      code: r.code,
      requirement: r.requirement,
      relevance: "Keyword match in title or description",
    }));
  }

  getComplianceChecklist(area: ComplianceCategory): string[] {
    return getComplianceChecklist(area);
  }
}

function pickRemediationText(
  remediation: BilingualString | string | undefined,
  recommendations: Array<BilingualString | string>,
  category: ComplianceCategory,
  locale: AppLocale
): string | undefined {
  if (remediation) return pickBilingual(locale, remediation);
  const match = recommendations.find((r) =>
    bilingualKey(r).toLowerCase().includes(category)
  );
  if (!match) return undefined;
  return pickBilingual(locale, match);
}

function mapComplianceCategory(category: ComplianceCategory): DiagnosisCategory {
  switch (category) {
    case "fire":
      return "fire_safety";
    case "structure":
      return "structure";
    case "accessibility":
      return "accessibility";
    case "energy":
      return "energy";
    case "heritage":
      return "architecture";
    default:
      return "architecture";
  }
}

export const complianceAgent = new ComplianceAgent();

export async function performComplianceCheck(
  project: ProjectWithRelations,
  context?: ComplianceMeasurements
) {
  return complianceAgent.performComplianceCheck(project, context);
}

export async function generateComplianceDiagnosis(
  project: ProjectWithRelations,
  context?: ComplianceMeasurements,
  locale?: AppLocale
) {
  return complianceAgent.generateComplianceDiagnosis(project, context, locale);
}

export function searchCodeRequirements(keyword: string) {
  return complianceAgent.searchCodeRequirements(keyword);
}

export type { ComplianceCheck, ComplianceEngineReport as ComplianceReport };
