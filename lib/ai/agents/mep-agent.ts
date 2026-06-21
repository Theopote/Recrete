import type { DiagnosisItem, ProjectWithRelations } from "@/types";

export interface MepAnalysisInput {
  electricalCapacityKva?: number;
  hvacAgeYears?: number;
  plumbingCondition?: "good" | "fair" | "poor";
  requiredElectricalKva?: number;
}

export interface HvacEfficiencyAssessment {
  estimatedCop: number;
  efficiencyRating: "poor" | "fair" | "good";
  annualEnergyImpactKwh?: number;
  note: string;
}

export interface PlumbingOptimization {
  condition: "good" | "fair" | "poor";
  findings: string[];
  optimizations: string[];
}

export interface MepAnalysisResult {
  overallRating: "adequate" | "upgrade_required" | "replacement_required";
  findings: string[];
  recommendations: string[];
  estimatedUpgradeScope: string[];
  electricalLoad?: {
    capacityKva: number;
    requiredKva: number;
    utilizationPercent: number;
    status: "adequate" | "marginal" | "insufficient";
  };
  hvacEfficiency?: HvacEfficiencyAssessment;
  plumbing?: PlumbingOptimization;
}

export class MepAgent {
  assessHvacEfficiency(
    project: ProjectWithRelations,
    hvacAgeYears?: number
  ): HvacEfficiencyAssessment {
    const age = hvacAgeYears ?? Math.max(0, new Date().getFullYear() - project.constructionYear - 8);
    let estimatedCop = 4.2;
    let efficiencyRating: HvacEfficiencyAssessment["efficiencyRating"] = "good";
    let note = "Equipment within efficient operating range for current occupancy.";

    if (age > 20) {
      estimatedCop = 2.4;
      efficiencyRating = "poor";
      note = "Legacy equipment likely below 50% of modern VRF COP; replacement strongly recommended.";
    } else if (age > 15) {
      estimatedCop = 2.9;
      efficiencyRating = "fair";
      note = "Aging HVAC — efficiency degraded; consider phased VRF or high-efficiency chiller upgrade.";
    } else if (age > 10) {
      estimatedCop = 3.4;
      efficiencyRating = "fair";
      note = "Moderate equipment age — schedule efficiency audit and controls optimization.";
    }

    const annualEnergyImpactKwh =
      efficiencyRating !== "good"
        ? Math.round(project.grossFloorArea * (efficiencyRating === "poor" ? 35 : 18))
        : undefined;

    return { estimatedCop, efficiencyRating, annualEnergyImpactKwh, note };
  }

  assessPlumbingOptimization(
    project: ProjectWithRelations,
    condition: "good" | "fair" | "poor" = "fair"
  ): PlumbingOptimization {
    const buildingAge = new Date().getFullYear() - project.constructionYear;
    const findings: string[] = [];
    const optimizations: string[] = [];

    if (condition === "poor") {
      findings.push("Plumbing risers and branch piping show significant deterioration or leakage risk.");
      optimizations.push("Replace vertical risers and corroded branch lines during renovation phasing.");
      optimizations.push("Install pressure-reducing valves and leak detection on main feeds.");
    } else if (condition === "fair") {
      findings.push("Plumbing serviceable but may not meet new occupancy peak demand.");
      optimizations.push("Verify fixture counts vs code for target function; upsize hot water capacity if needed.");
      if (buildingAge > 25) {
        optimizations.push("Replace aging galvanized sections with stainless or PPR in high-use zones.");
      }
    } else {
      findings.push("Plumbing condition reported good — focus on capacity verification for function change.");
      optimizations.push("Confirm drainage slope and venting for any program-driven fixture additions.");
    }

    if (project.targetFunction !== project.currentFunction) {
      optimizations.push(
        `Review sanitary load for ${project.currentFunction} → ${project.targetFunction} conversion.`
      );
    }

    return { condition, findings, optimizations };
  }

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
    let electricalLoad: MepAnalysisResult["electricalLoad"];

    const hvacAge = input.hvacAgeYears ?? Math.max(0, new Date().getFullYear() - project.constructionYear - 8);
    const hvacEfficiency = this.assessHvacEfficiency(project, hvacAge);

    if (hvacAge > 15 || hvacEfficiency.efficiencyRating === "poor") {
      findings.push(
        `HVAC efficiency ${hvacEfficiency.efficiencyRating} (est. COP ${hvacEfficiency.estimatedCop}). ${hvacEfficiency.note}`
      );
      estimatedUpgradeScope.push("HVAC replacement");
      if (hvacEfficiency.annualEnergyImpactKwh) {
        findings.push(
          `Inefficient HVAC may add ~${hvacEfficiency.annualEnergyImpactKwh.toLocaleString()} kWh/year vs modern baseline.`
        );
      }
      overallRating = "upgrade_required";
    } else if (buildingAge > 25 && input.hvacAgeYears === undefined) {
      findings.push("HVAC equipment likely beyond efficient service life for new occupancy.");
      estimatedUpgradeScope.push("HVAC replacement");
      overallRating = "upgrade_required";
    }

    if (input.electricalCapacityKva !== undefined) {
      const utilizationPercent = Math.round((input.electricalCapacityKva / requiredKva) * 100);
      const status: NonNullable<MepAnalysisResult["electricalLoad"]>["status"] =
        input.electricalCapacityKva >= requiredKva * 1.1
          ? "adequate"
          : input.electricalCapacityKva >= requiredKva * 0.9
            ? "marginal"
            : "insufficient";

      electricalLoad = {
        capacityKva: input.electricalCapacityKva,
        requiredKva,
        utilizationPercent,
        status,
      };

      if (status === "insufficient") {
        findings.push(
          `Electrical capacity ${input.electricalCapacityKva} kVA below estimated ${requiredKva} kVA for ${project.targetFunction}.`
        );
        estimatedUpgradeScope.push("Electrical service upgrade");
        overallRating = "replacement_required";
      } else if (status === "marginal") {
        findings.push(
          `Electrical load at ${utilizationPercent}% of estimated demand — limited headroom for new equipment.`
        );
        recommendations.push("Plan panel upgrade or load shedding for peak cultural/event loads.");
        if (overallRating === "adequate") overallRating = "upgrade_required";
      }
    } else {
      findings.push("Electrical load calculation not yet verified for target function.");
      recommendations.push("Commission MEP survey with panel capacity and riser documentation.");
    }

    const plumbingCondition = input.plumbingCondition ?? "fair";
    const plumbing = this.assessPlumbingOptimization(project, plumbingCondition);
    findings.push(...plumbing.findings);
    recommendations.push(...plumbing.optimizations.slice(0, 2));

    if (plumbingCondition === "poor") {
      estimatedUpgradeScope.push("Plumbing riser replacement");
      overallRating = overallRating === "replacement_required" ? "replacement_required" : "upgrade_required";
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
      electricalLoad,
      hvacEfficiency,
      plumbing,
    };
  }

  generateMepDiagnosis(
    project: ProjectWithRelations
  ): Omit<DiagnosisItem, "id" | "projectId" | "createdAt" | "updatedAt">[] {
    const buildingAge = new Date().getFullYear() - project.constructionYear;

    return [
      {
        title: "Electrical load verification for target program",
        category: "mep",
        severity: project.targetFunction !== project.currentFunction ? "high" : "medium",
        status: "identified",
        description: "Panel capacity and demand load should be calculated for new occupancy and event loads.",
        evidence: `${buildingAge}-year-old electrical installation`,
        recommendation: "Run MEP agent with panel capacity (kVA) and required load estimates.",
        relatedLocation: "Main switch room, floor panels",
        requiresEngineerReview: true,
      },
      {
        title: "HVAC system efficiency assessment",
        category: "mep",
        severity: buildingAge > 25 ? "medium" : "low",
        status: "identified",
        description: "Evaluate COP, controls, and zoning against target function comfort requirements.",
        evidence: `Building age ${buildingAge} years`,
        recommendation: "Input HVAC equipment age in MEP agent for efficiency rating and upgrade scope.",
        relatedLocation: "Mechanical rooms, roof plant",
        requiresEngineerReview: true,
      },
      {
        title: "Plumbing and drainage optimization review",
        category: "mep",
        severity: "medium",
        status: "identified",
        description: "Verify riser condition, peak fixture demand, and drainage capacity for renovation.",
        evidence: "Function change may increase sanitary load",
        recommendation: "Assess plumbing condition (good/fair/poor) and plan riser or branch upgrades.",
        relatedLocation: "Risers, basement drainage",
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
