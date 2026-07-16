import type { DiagnosisItem, ProjectWithRelations } from "@/types";
import { bi, type BilingualString } from "@/lib/i18n/bilingual";

export interface MepAnalysisInput {
  electricalCapacityKva?: number;
  hvacAgeYears?: number;
  plumbingCondition?: "good" | "fair" | "poor";
  requiredElectricalKva?: number;
}

export type MepClashType =
  | "shaft_overcrowding"
  | "plenum_clearance"
  | "beam_duct_conflict"
  | "function_change_shaft"
  | "electrical_routing"
  | "legacy_hvac_routing"
  | "plumbing_riser_conflict"
  | "low_floor_to_floor"
  | "routing_verification";

export type MepClashSeverity = "low" | "medium" | "high" | "critical";

export interface MepClashInput {
  shaftWidthMm?: number;
  shaftDepthMm?: number;
  floorToFloorHeightM?: number;
  ceilingPlenumMm?: number;
  mainBeamDepthMm?: number;
  hvacMainDuctWidthMm?: number;
  riserCount?: number;
}

export interface MepClashItem {
  id: string;
  type: MepClashType;
  priority: MepClashSeverity;
  disciplines: string[];
  title: BilingualString;
  description: BilingualString;
  location: BilingualString;
  remediation: BilingualString;
  clearanceMm?: number;
  requiredClearanceMm?: number;
}

export interface MepClashReport {
  clashCount: number;
  criticalCount: number;
  clashes: MepClashItem[];
  summary: BilingualString;
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

  detectPipelineClashes(
    project: ProjectWithRelations,
    input: MepClashInput & MepAnalysisInput = {}
  ): MepClashReport {
    const clashes: MepClashItem[] = [];
    const functionChange = project.currentFunction !== project.targetFunction;
    const shaftAreaMm2 =
      input.shaftWidthMm != null && input.shaftDepthMm != null
        ? input.shaftWidthMm * input.shaftDepthMm
        : undefined;
    const mmPerRiser =
      shaftAreaMm2 != null && input.riserCount != null && input.riserCount > 0
        ? shaftAreaMm2 / input.riserCount
        : undefined;

    const hvacAge =
      input.hvacAgeYears ?? Math.max(0, new Date().getFullYear() - project.constructionYear - 8);
    const requiredKva =
      input.requiredElectricalKva ??
      (project.targetFunction.includes("文化") ||
      project.targetFunction.toLowerCase().includes("cultural")
        ? 120
        : 80);
    const electricalInsufficient =
      input.electricalCapacityKva != null && input.electricalCapacityKva < requiredKva * 0.9;
    const plumbingCondition = input.plumbingCondition ?? "fair";

    const pushClash = (clash: MepClashItem) => {
      if (!clashes.some((existing) => existing.id === clash.id)) {
        clashes.push(clash);
      }
    };

    if (input.riserCount != null && input.riserCount >= 4) {
      if (shaftAreaMm2 != null && shaftAreaMm2 < 1_000_000) {
        pushClash({
          id: "shaft-overcrowding",
          type: "shaft_overcrowding",
          priority: input.riserCount >= 5 ? "critical" : "high",
          disciplines: ["HVAC", "Plumbing", "Electrical"],
          title: bi("Vertical shaft overcrowding", "竖向管井过密"),
          description: bi(
            `${input.riserCount} risers share a shaft of ~${Math.round(shaftAreaMm2 / 1000) / 1000} m² — below typical clearance for combined MEP routing.`,
            `${input.riserCount} 路立管共用约 ${Math.round(shaftAreaMm2 / 1000) / 1000} m² 管井，低于机电综合布线的常规净距要求。`
          ),
          location: bi("Vertical MEP shaft", "机电竖井"),
          remediation: bi(
            "Split risers into dedicated shafts or enlarge shaft before routing design freeze.",
            "在路由定案前分立管井或扩大管井截面。"
          ),
        });
      } else if (mmPerRiser != null && mmPerRiser < 220_000) {
        pushClash({
          id: "shaft-overcrowding",
          type: "shaft_overcrowding",
          priority: "high",
          disciplines: ["HVAC", "Plumbing", "Electrical"],
          title: bi("Insufficient shaft area per riser", "管井人均面积不足"),
          description: bi(
            `Average shaft area ~${Math.round(mmPerRiser / 1000)}k mm² per riser with ${input.riserCount} systems — likely routing conflicts during construction.`,
            `${input.riserCount} 路系统均摊管井面积约 ${Math.round(mmPerRiser / 1000)}k mm²，施工阶段易出现管线碰撞。`
          ),
          location: bi("Vertical MEP shaft", "机电竖井"),
          remediation: bi(
            "Reallocate risers or increase shaft dimensions; run coordinated routing workshop.",
            "重新分配立管或扩大管井，开展机电综合排布协调会。"
          ),
        });
      }
    }

    if (
      input.ceilingPlenumMm != null &&
      input.mainBeamDepthMm != null &&
      input.hvacMainDuctWidthMm != null
    ) {
      const requiredClearanceMm = input.mainBeamDepthMm + input.hvacMainDuctWidthMm + 150;
      if (input.ceilingPlenumMm < requiredClearanceMm) {
        pushClash({
          id: "plenum-clearance",
          type: "plenum_clearance",
          priority: input.ceilingPlenumMm < requiredClearanceMm * 0.85 ? "critical" : "high",
          disciplines: ["HVAC", "Structure"],
          title: bi("Ceiling plenum clearance conflict", "吊顶夹层净高冲突"),
          description: bi(
            `Plenum ${input.ceilingPlenumMm} mm is less than required ~${requiredClearanceMm} mm (beam ${input.mainBeamDepthMm} mm + duct ${input.hvacMainDuctWidthMm} mm + 150 mm clearance).`,
            `夹层净高 ${input.ceilingPlenumMm} mm 小于所需约 ${requiredClearanceMm} mm（梁 ${input.mainBeamDepthMm} mm + 风管 ${input.hvacMainDuctWidthMm} mm + 150 mm 余量）。`
          ),
          location: bi("Ceiling plenum, typical floor", "标准层吊顶夹层"),
          remediation: bi(
            "Lower duct routing, use flat-oval duct, or locally drop ceiling — coordinate with structure.",
            "降低风管路由、采用扁风管或局部降板，并与结构专业协调。"
          ),
          clearanceMm: input.ceilingPlenumMm,
          requiredClearanceMm,
        });
      }
    }

    if (
      input.mainBeamDepthMm != null &&
      input.hvacMainDuctWidthMm != null &&
      input.ceilingPlenumMm == null &&
      input.floorToFloorHeightM != null &&
      input.floorToFloorHeightM < 3.4
    ) {
      const estimatedPlenumMm = Math.max(0, (input.floorToFloorHeightM - 2.7) * 1000);
      const requiredClearanceMm = input.mainBeamDepthMm + input.hvacMainDuctWidthMm + 150;
      if (estimatedPlenumMm < requiredClearanceMm) {
        pushClash({
          id: "beam-duct-conflict",
          type: "beam_duct_conflict",
          priority: "high",
          disciplines: ["HVAC", "Structure"],
          title: bi("Beam vs main duct routing conflict", "结构梁与主风管路由冲突"),
          description: bi(
            `Estimated plenum ~${Math.round(estimatedPlenumMm)} mm (floor-to-floor ${input.floorToFloorHeightM} m) may not fit beam depth ${input.mainBeamDepthMm} mm and duct ${input.hvacMainDuctWidthMm} mm.`,
            `估算夹层净高约 ${Math.round(estimatedPlenumMm)} mm（层高 ${input.floorToFloorHeightM} m）可能无法容纳梁深 ${input.mainBeamDepthMm} mm 与风管 ${input.hvacMainDuctWidthMm} mm。`
          ),
          location: bi("Typical floor corridor / plenum zone", "标准层走道/夹层区"),
          remediation: bi(
            "Survey beam bottoms and reroute duct below beam soffit or through dedicated shaft.",
            "实测梁底标高，将风管改绕梁底或经由专用竖井敷设。"
          ),
          clearanceMm: estimatedPlenumMm,
          requiredClearanceMm,
        });
      }
    }

    if (functionChange) {
      if (input.shaftWidthMm != null && input.shaftWidthMm < 1000) {
        pushClash({
          id: "function-change-shaft",
          type: "function_change_shaft",
          priority: "high",
          disciplines: ["HVAC", "Plumbing", "Electrical"],
          title: bi("Shaft undersized for occupancy change", "功能转换后管井容量不足"),
          description: bi(
            `Converting ${project.currentFunction} → ${project.targetFunction} with shaft width ${input.shaftWidthMm} mm — likely insufficient for added loads.`,
            `功能由「${project.currentFunction}」转为「${project.targetFunction}」，管井宽度 ${input.shaftWidthMm} mm 可能无法满足新增负荷。`
          ),
          location: bi("Primary MEP shaft", "主机电竖井"),
          remediation: bi(
            "Evaluate shaft enlargement or new vertical routing path before design development.",
            "方案深化前评估管井扩增或新增竖向路由。"
          ),
        });
      } else if (input.shaftWidthMm == null) {
        pushClash({
          id: "function-change-shaft",
          type: "routing_verification",
          priority: "medium",
          disciplines: ["HVAC", "Plumbing", "Electrical"],
          title: bi("Shaft sizing verification required", "管井尺寸待核实"),
          description: bi(
            `Occupancy change to ${project.targetFunction} requires shaft and riser capacity review — dimensions not provided.`,
            `使用功能转为「${project.targetFunction}」，需复核管井与立管容量，尚未提供尺寸。`
          ),
          location: bi("Vertical MEP shafts", "机电竖向管井"),
          remediation: bi(
            "Measure existing shaft sizes and document riser counts on site.",
            "现场测量既有管井尺寸并统计立管数量。"
          ),
        });
      }
    }

    if (electricalInsufficient) {
      pushClash({
        id: "electrical-routing",
        type: "electrical_routing",
        priority: "high",
        disciplines: ["Electrical"],
        title: bi("Electrical upgrade routing conflict risk", "电气增容路由冲突风险"),
        description: bi(
          `Panel capacity ${input.electricalCapacityKva} kVA below ${requiredKva} kVA target — new feeders/risers may conflict with existing routing.`,
          `配电容量 ${input.electricalCapacityKva} kVA 低于目标 ${requiredKva} kVA，新增主干/立管可能与既有路由冲突。`
        ),
        location: bi("Main switch room, vertical risers", "变配电室、电气竖井"),
        remediation: bi(
          "Plan dedicated electrical shaft or surface raceway routes before panel upgrade.",
          "配电增容前规划专用电气竖井或明敷桥架路径。"
        ),
      });
    }

    if (functionChange && hvacAge > 15) {
      pushClash({
        id: "legacy-hvac-routing",
        type: "legacy_hvac_routing",
        priority: "medium",
        disciplines: ["HVAC"],
        title: bi("Legacy HVAC routing vs new program", "老旧暖通路由与新功能冲突"),
        description: bi(
          `HVAC equipment ~${hvacAge} years old with occupancy change — replacement ducts may not fit existing plenum/shaft paths.`,
          `暖通设备约 ${hvacAge} 年且功能变更，更换风管可能无法沿用现有夹层/管井路径。`
        ),
        location: bi("Mechanical rooms, ceiling plenum", "空调机房、吊顶夹层"),
        remediation: bi(
          "Scan existing duct routes and confirm plenum height before equipment selection.",
          "设备选型前扫描既有风管路由并确认夹层净高。"
        ),
      });
    }

    if (plumbingCondition === "poor" && (input.riserCount ?? 0) >= 2) {
      pushClash({
        id: "plumbing-riser-conflict",
        type: "plumbing_riser_conflict",
        priority: "high",
        disciplines: ["Plumbing"],
        title: bi("Plumbing riser replacement routing conflict", "给排水立管更换路由冲突"),
        description: bi(
          "Poor plumbing condition with multiple shared risers — replacement routing may conflict with live HVAC/electrical services.",
          "给排水状况较差且多路立管共用，更换路由可能与运行中的暖通/电气管线冲突。"
        ),
        location: bi("Plumbing risers, basement to upper floors", "给排水立管（地下至上层）"),
        remediation: bi(
          "Phase riser replacement floor-by-floor with temporary bypass and clash review.",
          "分层分期更换立管，设置临时旁通并完成碰撞复核。"
        ),
      });
    }

    if (input.floorToFloorHeightM != null && input.floorToFloorHeightM < 3.0) {
      pushClash({
        id: "low-floor-to-floor",
        type: "low_floor_to_floor",
        priority: "high",
        disciplines: ["HVAC", "Plumbing", "Electrical", "Structure"],
        title: bi("Low floor-to-floor height constrains MEP routing", "层高过低限制机电路由"),
        description: bi(
          `Floor-to-floor height ${input.floorToFloorHeightM} m leaves limited plenum for ducts, pipes, and cable trays.`,
          `层高 ${input.floorToFloorHeightM} m，吊顶夹层空间有限，风管、水管与桥架路由受限。`
        ),
        location: bi("Typical occupied floors", "标准使用楼层"),
        remediation: bi(
          "Use compact MEP layouts, shallow ducts, and coordinated ceiling drops.",
          "采用紧凑型机电布置、浅风管与协同降板方案。"
        ),
      });
    }

    if (
      functionChange &&
      input.ceilingPlenumMm == null &&
      input.floorToFloorHeightM == null &&
      clashes.every((c) => c.id !== "function-change-shaft")
    ) {
      pushClash({
        id: "routing-verification",
        type: "routing_verification",
        priority: "medium",
        disciplines: ["HVAC", "Plumbing", "Electrical"],
        title: bi("MEP routing survey recommended", "建议开展机电路由勘察"),
        description: bi(
          "Occupancy change without plenum or shaft dimensions — rule-based clash review is incomplete.",
          "功能变更但未提供夹层/管井尺寸，规则型冲突检测信息不完整。"
        ),
        location: bi("Project-wide MEP routing", "项目机电路由"),
        remediation: bi(
          "Input shaft size, plenum depth, and riser count, or commission as-built MEP survey.",
          "补充管井尺寸、夹层深度与立管数量，或委托机电现状勘察。"
        ),
      });
    }

    const criticalCount = clashes.filter(
      (c) => c.priority === "critical" || c.priority === "high"
    ).length;

    return {
      clashCount: clashes.length,
      criticalCount,
      clashes,
      summary:
        clashes.length === 0
          ? bi(
              "No rule-based pipeline clashes detected with current inputs.",
              "根据当前输入，未检测到规则型管线冲突。"
            )
          : bi(
              `${clashes.length} potential clash(es) detected (${criticalCount} high/critical).`,
              `检测到 ${clashes.length} 处潜在管线冲突（${criticalCount} 处高/严重）。`
            ),
    };
  }
}

export const mepAgent = new MepAgent();

export function assessMepCapacity(project: ProjectWithRelations, input?: MepAnalysisInput) {
  return mepAgent.assessMepCapacity(project, input);
}

export function generateMepDiagnosis(project: ProjectWithRelations) {
  return mepAgent.generateMepDiagnosis(project);
}

export function detectPipelineClashes(
  project: ProjectWithRelations,
  input?: MepClashInput & MepAnalysisInput
) {
  return mepAgent.detectPipelineClashes(project, input);
}
