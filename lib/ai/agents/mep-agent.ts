import type { DiagnosisItem, ProjectWithRelations } from "@/types";
import { bi, type BilingualString } from "@/lib/i18n/bilingual";

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
  note: BilingualString;
}

export interface PlumbingOptimization {
  condition: "good" | "fair" | "poor";
  findings: BilingualString[];
  optimizations: BilingualString[];
}

export interface MepAnalysisResult {
  overallRating: "adequate" | "upgrade_required" | "replacement_required";
  findings: BilingualString[];
  recommendations: BilingualString[];
  estimatedUpgradeScope: BilingualString[];
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
    let note = bi(
      "Equipment within efficient operating range for current occupancy.",
      "设备运行效率满足当前使用功能要求。"
    );

    if (age > 20) {
      estimatedCop = 2.4;
      efficiencyRating = "poor";
      note = bi(
        "Legacy equipment likely below 50% of modern VRF COP; replacement strongly recommended.",
        "老旧设备 COP 可能不足新型 VRF 系统的 50%，强烈建议更换。"
      );
    } else if (age > 15) {
      estimatedCop = 2.9;
      efficiencyRating = "fair";
      note = bi(
        "Aging HVAC — efficiency degraded; consider phased VRF or high-efficiency chiller upgrade.",
        "暖通设备老化、效率下降，建议分期更换 VRF 或高效冷水机组。"
      );
    } else if (age > 10) {
      estimatedCop = 3.4;
      efficiencyRating = "fair";
      note = bi(
        "Moderate equipment age — schedule efficiency audit and controls optimization.",
        "设备使用年限中等，建议开展能效检测与控制系统优化。"
      );
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
    const findings: BilingualString[] = [];
    const optimizations: BilingualString[] = [];

    if (condition === "poor") {
      findings.push(
        bi(
          "Plumbing risers and branch piping show significant deterioration or leakage risk.",
          "给排水立管与支管存在明显老化或渗漏风险。"
        )
      );
      optimizations.push(
        bi(
          "Replace vertical risers and corroded branch lines during renovation phasing.",
          "在改造分期中更换立管及腐蚀支管。"
        ),
        bi(
          "Install pressure-reducing valves and leak detection on main feeds.",
          "在总进水管设置减压阀与漏水监测。"
        )
      );
    } else if (condition === "fair") {
      findings.push(
        bi(
          "Plumbing serviceable but may not meet new occupancy peak demand.",
          "给排水系统尚可运行，但可能无法满足新功能高峰用水需求。"
        )
      );
      optimizations.push(
        bi(
          "Verify fixture counts vs code for target function; upsize hot water capacity if needed.",
          "核实目标功能的卫生器具数量是否符合规范，必要时增大热水供应能力。"
        )
      );
      if (buildingAge > 25) {
        optimizations.push(
          bi(
            "Replace aging galvanized sections with stainless or PPR in high-use zones.",
            "高使用区域将老化镀锌管更换为不锈钢或 PPR 管。"
          )
        );
      }
    } else {
      findings.push(
        bi(
          "Plumbing condition reported good — focus on capacity verification for function change.",
          "给排水状况良好，重点核实功能变更后的容量需求。"
        )
      );
      optimizations.push(
        bi(
          "Confirm drainage slope and venting for any program-driven fixture additions.",
          "确认新增卫生器具后的排水坡度与通气条件。"
        )
      );
    }

    if (project.targetFunction !== project.currentFunction) {
      optimizations.push(
        bi(
          `Review sanitary load for ${project.currentFunction} → ${project.targetFunction} conversion.`,
          `复核功能变更（${project.currentFunction} → ${project.targetFunction}）的卫生负荷。`
        )
      );
    }

    return { condition, findings, optimizations };
  }

  assessMepCapacity(
    project: ProjectWithRelations,
    input: MepAnalysisInput = {}
  ): MepAnalysisResult {
    const findings: BilingualString[] = [];
    const recommendations: BilingualString[] = [];
    const estimatedUpgradeScope: BilingualString[] = [];

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
        bi(
          `HVAC efficiency ${hvacEfficiency.efficiencyRating} (est. COP ${hvacEfficiency.estimatedCop}). ${hvacEfficiency.note.en}`,
          `暖通效率 ${hvacEfficiency.efficiencyRating}（估算 COP ${hvacEfficiency.estimatedCop}）。${hvacEfficiency.note.zh}`
        )
      );
      estimatedUpgradeScope.push(bi("HVAC replacement", "暖通系统更换"));
      if (hvacEfficiency.annualEnergyImpactKwh) {
        findings.push(
          bi(
            `Inefficient HVAC may add ~${hvacEfficiency.annualEnergyImpactKwh.toLocaleString()} kWh/year vs modern baseline.`,
            `低效暖通系统较现代基准可能额外增加约 ${hvacEfficiency.annualEnergyImpactKwh.toLocaleString()} kWh/年能耗。`
          )
        );
      }
      overallRating = "upgrade_required";
    } else if (buildingAge > 25 && input.hvacAgeYears === undefined) {
      findings.push(
        bi(
          "HVAC equipment likely beyond efficient service life for new occupancy.",
          "暖通设备可能已超出新使用功能下的经济使用寿命。"
        )
      );
      estimatedUpgradeScope.push(bi("HVAC replacement", "暖通系统更换"));
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
          bi(
            `Electrical capacity ${input.electricalCapacityKva} kVA below estimated ${requiredKva} kVA for ${project.targetFunction}.`,
            `电气容量 ${input.electricalCapacityKva} kVA 低于「${project.targetFunction}」估算需求 ${requiredKva} kVA。`
          )
        );
        estimatedUpgradeScope.push(bi("Electrical service upgrade", "电气增容改造"));
        overallRating = "replacement_required";
      } else if (status === "marginal") {
        findings.push(
          bi(
            `Electrical load at ${utilizationPercent}% of estimated demand — limited headroom for new equipment.`,
            `电气负荷已达估算需求的 ${utilizationPercent}%，新增设备余量有限。`
          )
        );
        recommendations.push(
          bi(
            "Plan panel upgrade or load shedding for peak cultural/event loads.",
            "针对文化/活动高峰负荷，规划配电升级或负荷调配。"
          )
        );
        if (overallRating === "adequate") overallRating = "upgrade_required";
      }
    } else {
      findings.push(
        bi(
          "Electrical load calculation not yet verified for target function.",
          "目标功能的电气负荷尚未核算确认。"
        )
      );
      recommendations.push(
        bi(
          "Commission MEP survey with panel capacity and riser documentation.",
          "委托机电勘察，核实配电容量与竖向管线资料。"
        )
      );
    }

    const plumbingCondition = input.plumbingCondition ?? "fair";
    const plumbing = this.assessPlumbingOptimization(project, plumbingCondition);
    findings.push(...plumbing.findings);
    recommendations.push(...plumbing.optimizations.slice(0, 2));

    if (plumbingCondition === "poor") {
      estimatedUpgradeScope.push(bi("Plumbing riser replacement", "给排水立管更换"));
      overallRating = overallRating === "replacement_required" ? "replacement_required" : "upgrade_required";
    }

    if (project.currentFunction !== project.targetFunction) {
      recommendations.push(
        bi(
          "Complete MEP capacity study aligned with new program loads.",
          "按新功能负荷完成机电容量专项研究。"
        ),
        bi(
          "Verify shaft sizes for additional HVAC and electrical distribution.",
          "核实新增暖通与配电所需的管井尺寸。"
        )
      );
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
