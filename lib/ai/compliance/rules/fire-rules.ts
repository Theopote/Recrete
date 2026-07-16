import type { ComplianceRuleDefinition } from "../types";
import { bi } from "@/lib/i18n/bilingual";
import { isFunctionConversion } from "../scenario-resolver";

export const fireRules: ComplianceRuleDefinition[] = [
  {
    id: "fire-compartment-area",
    codeId: "gb50016",
    codeRef: "GB 50016-2014",
    section: "5.5.13",
    category: "fire",
    requirement: "Fire compartmentation for occupancy change",
    requirementZh: "功能变更防火分区",
    priority: "critical",
    scenarios: ["function_conversion", "interior_renovation"],
    applies: (ctx) => isFunctionConversion(ctx.project),
    evaluate: (ctx) => {
      const area = ctx.measurements.fireCompartmentArea;
      const limit = 2500;
      if (area == null) {
        return {
          status: "requires_verification",
          requiredValue: `≤ ${limit} m² (Class 1-2)`,
          note: "Function conversion requires fire compartmentation review",
          noteZh: "功能转换需复核防火分区面积",
          remediation: bi(
            "Measure floor plate areas and verify fire-rated separations",
            "测量各层平面面积并核实防火分隔"
          ),
        };
      }
      const compliant = area <= limit;
      return {
        status: compliant ? "compliant" : "non_compliant",
        actualValue: `${area} m²`,
        requiredValue: `≤ ${limit} m² (Class 1-2)`,
        note: compliant
          ? "Fire compartment within code limit"
          : "Fire compartment area exceeds limit for new occupancy",
        noteZh: compliant ? "防火分区面积满足限值" : "防火分区面积超出新使用功能限值",
        remediation: compliant
          ? undefined
          : bi(
              "Subdivide with fire-rated walls or add sprinkler system per GB 50016",
              "按 GB 50016 设置防火墙或增设喷淋系统"
            ),
      };
    },
  },
  {
    id: "evacuation-stair-width",
    codeId: "gb50016",
    codeRef: "GB 50016-2014",
    section: "5.5.18",
    category: "fire",
    requirement: "Evacuation stairway width",
    requirementZh: "疏散楼梯净宽度",
    priority: "high",
    scenarios: ["all", "function_conversion", "public_building_renovation"],
    evaluate: (ctx) => {
      const width = ctx.measurements.stairWidth;
      const minWidth = ctx.project.floorCount > 6 ? 1.2 : 1.1;
      if (width == null) {
        return {
          status: "requires_verification",
          actualValue: "Not measured",
          requiredValue: `≥ ${minWidth}m`,
          note: "Measurement required for all evacuation stairs",
          noteZh: "需测量全部疏散楼梯净宽",
          remediation: bi(
            "Survey all egress stairs and record minimum clear width",
            "踏勘全部疏散楼梯并记录最小净宽"
          ),
        };
      }
      const compliant = width >= minWidth;
      return {
        status: compliant ? "compliant" : "non_compliant",
        actualValue: `${width}m`,
        requiredValue: `≥ ${minWidth}m`,
        note: compliant ? "Meets minimum width requirement" : "Below minimum width",
        noteZh: compliant ? "满足最小净宽要求" : "低于最小净宽要求",
        remediation: compliant
          ? undefined
          : bi("Widen stairs or provide additional egress routes", "加宽楼梯或增设疏散通道"),
      };
    },
  },
  {
    id: "evacuation-travel-distance",
    codeId: "gb50016",
    codeRef: "GB 50016-2014",
    section: "5.5.17",
    category: "fire",
    requirement: "Maximum evacuation travel distance",
    requirementZh: "疏散走道至最近安全出口距离",
    priority: "high",
    scenarios: ["public_building_renovation", "function_conversion"],
    evaluate: (ctx) => {
      const distance = ctx.measurements.travelDistance;
      const hasSprinkler = ctx.measurements.hasSprinkler ?? false;
      const limit = hasSprinkler ? 37.5 : 30;
      if (distance == null) {
        return {
          status: "requires_verification",
          requiredValue: `≤ ${limit}m${hasSprinkler ? " (with sprinkler)" : ""}`,
          note: "Travel distance survey required for public occupancy",
          noteZh: "公共建筑需复核疏散距离",
          remediation: bi(
            "Survey evacuation travel distances on each floor",
            "逐层测量疏散走道至最近安全出口距离"
          ),
        };
      }
      const compliant = distance <= limit;
      return {
        status: compliant ? "compliant" : "non_compliant",
        actualValue: `${distance}m`,
        requiredValue: `≤ ${limit}m`,
        note: compliant ? "Travel distance within limit" : "Travel distance exceeds code limit",
        noteZh: compliant ? "疏散距离满足限值" : "疏散距离超出限值",
        remediation: compliant
          ? undefined
          : bi("Add exits, shorten travel paths, or add sprinklers", "增设出口、缩短疏散路径或增设喷淋"),
      };
    },
  },
  {
    id: "interior-finish-rating",
    codeId: "gb50016",
    codeRef: "GB 50016-2014",
    section: "8.3.3",
    category: "fire",
    requirement: "Interior finish flame spread rating",
    requirementZh: "内部装修材料燃烧性能",
    priority: "medium",
    scenarios: ["function_conversion", "interior_renovation"],
    applies: (ctx) => isFunctionConversion(ctx.project),
    evaluate: () => ({
      status: "requires_verification",
      requiredValue: "Class per occupancy (typically B1 ceiling, B2 walls)",
      note: "Verify finish certificates against new occupancy classification",
      noteZh: "按新使用功能核对顶棚、墙面装修材料燃烧性能等级",
      remediation: bi(
        "Collect material certificates and verify flame spread class",
        "收集材料证书并核实燃烧性能等级"
      ),
    }),
  },
];
