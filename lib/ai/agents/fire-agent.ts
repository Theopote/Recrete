import type { ProjectWithRelations, DiagnosisItem } from "@/types";
import { bi, type BilingualString } from "@/lib/i18n/bilingual";

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
  findings: BilingualString[];
  recommendations: BilingualString[];
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

    const findings: BilingualString[] = [
      bi(
        `Target occupancy change to ${project.targetFunction} requires fire engineering review per GB 50016.`,
        `目标功能变更为「${project.targetFunction}」，须按 GB 50016 进行消防专项复核。`
      ),
    ];

    if (input.travelDistance && input.travelDistance > 45) {
      findings.push(
        bi(
          `Travel distance ${input.travelDistance}m may exceed allowable egress path length.`,
          `疏散距离 ${input.travelDistance}m 可能超过规范允许的最大疏散路径长度。`
        )
      );
    }
    if (input.occupantLoad && input.stairWidth) {
      const capacity = input.stairWidth * 200;
      if (input.occupantLoad > capacity) {
        findings.push(
          bi(
            `Occupant load ${input.occupantLoad} may exceed stair capacity ~${capacity}.`,
            `人员荷载 ${input.occupantLoad} 可能超过楼梯通行能力（约 ${capacity} 人）。`
          )
        );
      }
    }

    const recommendations: BilingualString[] = [
      bi("Verify fire compartment boundaries on each floor plate.", "逐层核实防火分区边界。"),
      bi("Measure all egress stair widths and travel distances.", "测量所有疏散楼梯宽度与疏散距离。"),
      ...(compartmentRating === "non_compliant"
        ? [
            bi(
              "Subdivide floor plate or provide engineered smoke control / sprinkler compensation.",
              "划分防火分区，或采用经设计的防烟措施 / 喷淋补偿方案。"
            ),
          ]
        : []),
      ...(egressRating === "insufficient"
        ? [bi("Widen stairs or provide additional egress routes.", "加宽楼梯或增设疏散通道。")]
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
