import type { ComplianceRuleDefinition } from "../types";
import { bi } from "@/lib/i18n/bilingual";
import { isFunctionConversion } from "../scenario-resolver";

function targetLiveLoadKN(targetFunction: string): number {
  const lower = targetFunction.toLowerCase();
  if (targetFunction.includes("会堂") || lower.includes("assembly")) return 3.5;
  if (targetFunction.includes("展") || lower.includes("exhibition")) return 3.5;
  if (targetFunction.includes("书库") || lower.includes("stack")) return 5.0;
  if (targetFunction.includes("图书") || lower.includes("library")) return 2.5;
  return 2.0;
}

export const structureRules: ComplianceRuleDefinition[] = [
  {
    id: "concrete-carbonation",
    codeId: "gb50292",
    codeRef: "GB 50292-2015",
    section: "7.3.5",
    category: "structure",
    requirement: "Concrete carbonation depth assessment",
    requirementZh: "混凝土碳化深度评定",
    priority: "high",
    scenarios: ["structural_assessment", "pre_renovation_inspection"],
    evaluate: (ctx) => {
      const depth = ctx.measurements.carbonationDepth;
      const cover = ctx.measurements.coverThickness ?? 25;
      if (depth == null) {
        return {
          status: "requires_verification",
          requiredValue: "Carbonation/cover ratio < 0.8 for Class B",
          note: "Field carbonation test required for existing concrete",
          noteZh: "需现场检测碳化深度与保护层厚度",
          remediation: bi(
            "Perform carbonation depth and cover thickness testing on site",
            "现场检测碳化深度与保护层厚度"
          ),
        };
      }
      const ratio = depth / cover;
      const compliant = ratio < 0.8;
      return {
        status: compliant ? "compliant" : "non_compliant",
        actualValue: `${depth}mm (ratio ${ratio.toFixed(2)})`,
        requiredValue: "Ratio < 0.8 (Class B or better)",
        note: compliant
          ? "Carbonation within acceptable range"
          : "Carbonation depth indicates reinforcement corrosion risk",
        noteZh: compliant ? "碳化深度在可接受范围" : "碳化深度提示钢筋锈蚀风险",
        remediation: compliant
          ? undefined
          : bi(
              "Repair cover, treat corrosion, or strengthen affected members",
              "修复保护层、处理锈蚀或加固受损构件"
            ),
      };
    },
  },
  {
    id: "floor-live-load",
    codeId: "gb50352",
    codeRef: "GB 50352-2019",
    section: "6.7.2",
    category: "structure",
    requirement: "Floor live load capacity",
    requirementZh: "楼面活荷载承载",
    priority: "high",
    scenarios: ["function_conversion", "office_renovation"],
    applies: (ctx) => isFunctionConversion(ctx.project),
    evaluate: (ctx) => {
      const existing = ctx.measurements.existingLoadKN;
      const required =
        ctx.measurements.targetLoadKN ?? targetLiveLoadKN(ctx.project.targetFunction);
      if (existing == null) {
        return {
          status: "requires_verification",
          requiredValue: `≥ ${required} kN/m² for ${ctx.project.targetFunction}`,
          note: "Structural load survey required for occupancy change",
          noteZh: "功能转换需结构荷载复核",
          remediation: bi(
            "Commission structural load assessment for new occupancy",
            "委托结构荷载复核"
          ),
        };
      }
      const compliant = existing >= required;
      return {
        status: compliant ? "compliant" : "non_compliant",
        actualValue: `${existing} kN/m²`,
        requiredValue: `≥ ${required} kN/m²`,
        note: compliant ? "Existing capacity meets target load" : "Existing floor may be under-capacity",
        noteZh: compliant ? "现有承载力满足目标荷载" : "现有楼面承载力可能不足",
        remediation: compliant
          ? undefined
          : bi(
              "Structural strengthening or load redistribution required",
              "需结构加固或荷载重分布"
            ),
      };
    },
  },
  {
    id: "seismic-retrofit-review",
    codeId: "gb50011",
    codeRef: "GB 50011-2010",
    section: "5.1.4",
    category: "structure",
    requirement: "Seismic retrofit assessment",
    requirementZh: "抗震鉴定与加固",
    priority: "high",
    scenarios: ["structural_assessment", "safety_upgrade", "pre_renovation_inspection"],
    applies: (ctx) => ctx.project.constructionYear < 2010,
    evaluate: (ctx) => ({
      status: "requires_verification",
      requiredValue: "Seismic appraisal per current GB 50011",
      note: `Building constructed ${ctx.project.constructionYear} — predates current seismic code`,
      noteZh: `建筑建于 ${ctx.project.constructionYear} 年，需按现行抗震规范鉴定`,
      remediation: bi(
        "Commission seismic appraisal before major structural intervention",
        "重大结构改造前应委托抗震鉴定"
      ),
    }),
  },
];
