import type { DiagnosisItem, ProjectWithRelations } from "@/types";

export interface MepAnalysisInput {
  electricalCapacityKva?: number;
  hvacAgeYears?: number;
  plumbingCondition?: "good" | "fair" | "poor";
  requiredElectricalKva?: number;
}

export interface MepAnalysisResult {
  overallRating: "adequate" | "upgrade_required" | "replacement_required";
  findings: string[];
  recommendations: string[];
  estimatedUpgradeScope: string[];
}

export class MepAgent {
  assessMepCapacity(
    project: ProjectWithRelations,
    input: MepAnalysisInput = {}
  ): MepAnalysisResult {
    const findings: string[] = [];
    const recommendations: string[] = [];
    const estimatedUpgradeScope: string[] = [];

    const buildingAge = new Date().getFullYear() - project.constructionYear;
    const requiredKva =
      input.requiredElectricalKva ??
      (project.targetFunction.includes("文化") || project.targetFunction.toLowerCase().includes("cultural")
        ? 120
        : 80);

    let overallRating: MepAnalysisResult["overallRating"] = "adequate";

    if (input.hvacAgeYears !== undefined ? input.hvacAgeYears > 15 : buildingAge > 25) {
      findings.push("HVAC equipment likely beyond efficient service life for new occupancy.");
      estimatedUpgradeScope.push("HVAC replacement");
      overallRating = "upgrade_required";
    }

    if (input.electricalCapacityKva !== undefined) {
      if (input.electricalCapacityKva < requiredKva) {
        findings.push(
          `Electrical capacity ${input.electricalCapacityKva} kVA below estimated ${requiredKva} kVA for ${project.targetFunction}.`
        );
        estimatedUpgradeScope.push("Electrical service upgrade");
        overallRating = "replacement_required";
      }
    } else {
      findings.push("Electrical load calculation not yet verified for target function.");
      recommendations.push("Commission MEP survey with panel capacity and riser documentation.");
    }

    if (input.plumbingCondition === "poor") {
      findings.push("Plumbing condition reported poor — expect riser replacement in renovation scope.");
      estimatedUpgradeScope.push("Plumbing riser replacement");
      overallRating = "upgrade_required";
    }

    if (project.currentFunction !== project.targetFunction) {
      recommendations.push("Complete MEP capacity study aligned with new program loads.");
      recommendations.push("Verify shaft sizes for additional HVAC and electrical distribution.");
    }

    return {
      overallRating,
      findings,
      recommendations,
      estimatedUpgradeScope,
    };
  }

  generateMepDiagnosis(
    project: ProjectWithRelations
  ): Omit<DiagnosisItem, "id" | "projectId" | "createdAt" | "updatedAt">[] {
    const buildingAge = new Date().getFullYear() - project.constructionYear;

    return [
      {
        title: "MEP capacity verification for function change",
        category: "mep",
        severity: project.targetFunction !== project.currentFunction ? "high" : "medium",
        status: "identified",
        description: `Assess HVAC, electrical, and plumbing capacity for conversion to ${project.targetFunction}.`,
        evidence: `${buildingAge}-year-old building systems`,
        recommendation: "Run MEP agent assessment with panel capacity and equipment age data.",
        relatedLocation: "Mechanical rooms, risers, roof plant",
        requiresEngineerReview: true,
      },
      ...(buildingAge > 20
        ? [
            {
              title: "Legacy MEP equipment replacement scope",
              category: "mep" as const,
              severity: "medium" as const,
              status: "identified" as const,
              description: "Equipment age suggests partial or full MEP replacement during renovation.",
              evidence: `Building age ${buildingAge} years`,
              recommendation: "Prioritize energy modeling and phased MEP replacement plan.",
              relatedLocation: "Basement plant, roof",
              requiresEngineerReview: true,
            },
          ]
        : []),
    ];
  }
}

export const mepAgent = new MepAgent();

export function assessMepCapacity(project: ProjectWithRelations, input?: MepAnalysisInput) {
  return mepAgent.assessMepCapacity(project, input);
}

export function generateMepDiagnosis(project: ProjectWithRelations) {
  return mepAgent.generateMepDiagnosis(project);
}
