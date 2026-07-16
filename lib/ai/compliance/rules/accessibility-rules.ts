import type { ComplianceRuleDefinition } from "../types";
import { bi } from "@/lib/i18n/bilingual";
import { isPublicTargetFunction } from "../scenario-resolver";

export const accessibilityRules: ComplianceRuleDefinition[] = [
  {
    id: "accessible-entrance",
    codeId: "gb50763_accessibility",
    codeRef: "GB 50763-2012",
    section: "3.2.1",
    category: "accessibility",
    requirement: "Accessible entrance",
    requirementZh: "无障碍入口",
    priority: "high",
    scenarios: ["public_building_renovation", "function_conversion"],
    applies: (ctx) => isPublicTargetFunction(ctx.project.targetFunction),
    evaluate: (ctx) => {
      const hasAccessible = ctx.measurements.hasAccessibleEntrance ?? false;
      return {
        status: hasAccessible ? "compliant" : "non_compliant",
        actualValue: hasAccessible ? "Provided" : "Not provided",
        requiredValue: "At least one accessible entrance required",
        note: hasAccessible ? "Accessible entrance available" : "No accessible entrance",
        noteZh: hasAccessible ? "已设无障碍入口" : "未设无障碍入口",
        remediation: hasAccessible
          ? undefined
          : bi(
              "Install ramp or level entrance (max slope 1:12) at main entry",
              "于主入口增设坡道或平坡入口（坡度不大于 1:12）"
            ),
      };
    },
  },
  {
    id: "accessible-toilet",
    codeId: "gb50763_accessibility",
    codeRef: "GB 50763-2012",
    section: "3.9",
    category: "accessibility",
    requirement: "Accessible toilet facilities",
    requirementZh: "无障碍卫生间",
    priority: "medium",
    scenarios: ["public_building_renovation"],
    applies: (ctx) => isPublicTargetFunction(ctx.project.targetFunction),
    evaluate: () => ({
      status: "requires_verification",
      requiredValue: "Accessible toilet on each public floor",
      note: "Verify accessible toilet provision per floor",
      noteZh: "复核各层公共卫生间无障碍设施设置",
      remediation: bi(
        "Provide accessible toilet with 1.5m turning radius and grab bars",
        "设置无障碍卫生间，净宽满足 1.5m 回转半径并配置扶手"
      ),
    }),
  },
];
