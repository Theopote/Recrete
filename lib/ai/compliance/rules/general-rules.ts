import type { ComplianceRuleDefinition } from "../types";
import { bi } from "@/lib/i18n/bilingual";
import { minCeilingHeight } from "../climate-zones";
import { isFunctionConversion } from "../scenario-resolver";

export const generalRules: ComplianceRuleDefinition[] = [
  {
    id: "ceiling-height",
    codeId: "gb50352",
    codeRef: "GB 50352-2019",
    section: "6.6.1",
    category: "general",
    requirement: "Minimum ceiling height",
    requirementZh: "房间净高",
    priority: "high",
    scenarios: ["all", "office_renovation", "function_conversion"],
    evaluate: (ctx) => {
      const height = ctx.measurements.ceilingHeight;
      const minHeight = minCeilingHeight(ctx.project.targetFunction);
      if (height == null) {
        return {
          status: "requires_verification",
          requiredValue: `≥ ${minHeight}m`,
          note: "Ceiling height survey required for target occupancy",
          noteZh: "需测量目标功能房间净高",
          remediation: bi(
            "Survey ceiling heights in representative rooms for target occupancy",
            "抽样测量目标功能房间净高"
          ),
        };
      }
      const compliant = height >= minHeight;
      return {
        status: compliant ? "compliant" : "non_compliant",
        actualValue: `${height}m`,
        requiredValue: `≥ ${minHeight}m`,
        note: compliant ? "Meets minimum height" : "Below required height for target use",
        noteZh: compliant ? "满足净高要求" : "净高低于目标功能要求",
        remediation: compliant
          ? undefined
          : bi(
              "Consider raised floors, slab openings, or revise program layout",
              "考虑架空地板、楼板开洞或调整功能布局"
            ),
      };
    },
  },
  {
    id: "occupancy-change-review",
    codeId: "gb50352",
    codeRef: "GB 50352-2019",
    section: "General",
    category: "general",
    requirement: "Occupancy change code review",
    requirementZh: "使用功能变更合规复核",
    priority: "high",
    scenarios: ["function_conversion"],
    applies: (ctx) => isFunctionConversion(ctx.project),
    evaluate: (ctx) => ({
      status: "requires_verification",
      requiredValue: "Full code review for new occupancy type",
      note: `Converting from ${ctx.project.currentFunction} to ${ctx.project.targetFunction}`,
      noteZh: `由「${ctx.project.currentFunction}」转为「${ctx.project.targetFunction}」需全面规范复核`,
      remediation: bi(
        "Submit revised program to local planning and fire authorities",
        "将修订方案报送规划与消防主管部门"
      ),
    }),
  },
];
