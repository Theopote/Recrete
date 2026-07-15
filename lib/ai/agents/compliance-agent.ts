import type { ProjectWithRelations, DiagnosisItem, DiagnosisCategory } from "@/types";
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
    context?: ComplianceMeasurements
  ): Promise<Omit<DiagnosisItem, "id" | "projectId" | "createdAt" | "updatedAt">[]> {
    const result = await this.performComplianceCheck(project, context);

    return result.checks
      .filter((check) => check.status !== "compliant" && check.status !== "not_applicable")
      .map((check) => ({
        title: check.requirement,
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
        description: check.noteZh ?? check.note,
        evidence: `${check.code} §${check.section} — required: ${check.requiredValue}${
          check.actualValue ? `, actual: ${check.actualValue}` : ""
        }`,
        recommendation:
          check.remediation ??
          result.recommendations.find((r) =>
            r.toLowerCase().includes(check.category)
          ) ??
          "Verify on site and engage licensed professional for confirmation.",
        relatedLocation: check.category === "fire" ? "Egress and fire compartments" : undefined,
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
  context?: ComplianceMeasurements
) {
  return complianceAgent.generateComplianceDiagnosis(project, context);
}

export function searchCodeRequirements(keyword: string) {
  return complianceAgent.searchCodeRequirements(keyword);
}

export type { ComplianceCheck, ComplianceEngineReport as ComplianceReport };
