import type { ProjectWithRelations, DiagnosisItem } from "@/types";

export interface FireAnalysisInput {
  occupantLoad?: number;
  stairWidth?: number;
  travelDistance?: number;
  floorArea?: number;
  hasSprinkler?: boolean;
}

export interface FireAnalysisResult {
  egressRating: "adequate" | "marginal" | "insufficient" | "unknown";
  compartmentRating: "compliant" | "non_compliant" | "requires_verification";
  findings: string[];
  recommendations: string[];
  evacuationWidthRequired: number;
}

export class FireProtectionAgent {
  analyzeEvacuationAndCompartmentation(
    project: ProjectWithRelations,
    input: FireAnalysisInput = {}
  ): FireAnalysisResult {
    const minStairWidth = project.floorCount > 6 ? 1.2 : 1.1;
    const maxCompartment = project.targetFunction.includes("公共") ? 2500 : 5000;

    let egressRating: FireAnalysisResult["egressRating"] = "unknown";
    if (input.stairWidth !== undefined) {
      egressRating =
        input.stairWidth >= minStairWidth
          ? input.travelDistance && input.travelDistance > 45
            ? "marginal"
            : "adequate"
          : "insufficient";
    }

    let compartmentRating: FireAnalysisResult["compartmentRating"] = "requires_verification";
    if (input.floorArea !== undefined) {
      const effectiveArea = input.hasSprinkler ? input.floorArea * 1.5 : input.floorArea;
      compartmentRating = effectiveArea <= maxCompartment ? "compliant" : "non_compliant";
    }

    const findings: string[] = [
      `Target occupancy change to ${project.targetFunction} requires fire engineering review per GB 50016.`,
    ];

    if (input.travelDistance && input.travelDistance > 45) {
      findings.push(`Travel distance ${input.travelDistance}m may exceed allowable egress path length.`);
    }
    if (input.occupantLoad && input.stairWidth) {
      const capacity = input.stairWidth * 200;
      if (input.occupantLoad > capacity) {
        findings.push(`Occupant load ${input.occupantLoad} may exceed stair capacity ~${capacity}.`);
      }
    }

    const recommendations = [
      "Verify fire compartment boundaries on each floor plate.",
      "Measure all egress stair widths and travel distances.",
      ...(compartmentRating === "non_compliant"
        ? ["Subdivide floor plate or provide engineered smoke control / sprinkler compensation."]
        : []),
      ...(egressRating === "insufficient"
        ? ["Widen stairs or provide additional egress routes."]
        : []),
    ];

    return {
      egressRating,
      compartmentRating,
      findings,
      recommendations,
      evacuationWidthRequired: minStairWidth,
    };
  }

  generateFireDiagnosis(
    project: ProjectWithRelations
  ): Omit<DiagnosisItem, "id" | "projectId" | "createdAt" | "updatedAt">[] {
    const items: Omit<DiagnosisItem, "id" | "projectId" | "createdAt" | "updatedAt">[] = [];

    if (project.targetFunction !== project.currentFunction) {
      items.push({
        title: "Fire compartmentation review for occupancy change",
        category: "fire_safety",
        severity: "high",
        status: "identified",
        description: "Function conversion requires verification of fire compartments and egress capacity.",
        evidence: "GB 50016-2014 occupancy change provisions",
        recommendation: "Run fire protection agent analysis with measured floor areas and stair widths.",
        relatedLocation: "All floors",
        requiresEngineerReview: true,
      });
    }

    if (project.floorCount > 3) {
      items.push({
        title: "Evacuation path verification",
        category: "fire_safety",
        severity: "medium",
        status: "identified",
        description: `${project.floorCount}-story building requires measured egress paths and stair capacities.`,
        evidence: "Multi-story public occupancy requirements",
        recommendation: "Document travel distances and stair widths during survey.",
        relatedLocation: "Stairs and corridors",
        requiresEngineerReview: true,
      });
    }

    return items;
  }
}

export const fireProtectionAgent = new FireProtectionAgent();

export function analyzeFireSafety(
  project: ProjectWithRelations,
  input?: FireAnalysisInput
) {
  return fireProtectionAgent.analyzeEvacuationAndCompartmentation(project, input);
}

export function generateFireDiagnosis(project: ProjectWithRelations) {
  return fireProtectionAgent.generateFireDiagnosis(project);
}
