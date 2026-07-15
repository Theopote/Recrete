import type { ComplianceRuleDefinition } from "../types";
import { maxWindowUValue } from "../climate-zones";
import { isPublicTargetFunction } from "../scenario-resolver";

export const energyRules: ComplianceRuleDefinition[] = [
  {
    id: "window-u-value",
    codeId: "gb50189",
    codeRef: "GB 50189-2015",
    section: "4.2.2",
    category: "energy",
    requirement: "External window U-value",
    requirementZh: "外窗传热系数",
    priority: "medium",
    scenarios: ["facade_renovation", "window_replacement", "energy_retrofit", "public_building_renovation"],
    applies: (ctx) =>
      isPublicTargetFunction(ctx.project.targetFunction) ||
      ctx.scenarios.includes("energy_retrofit") ||
      ctx.scenarios.includes("facade_renovation"),
    evaluate: (ctx) => {
      const uValue = ctx.measurements.windowUValue;
      const maxU = maxWindowUValue(ctx.climateZone as Parameters<typeof maxWindowUValue>[0]);
      if (uValue == null) {
        return {
          status: "requires_verification",
          requiredValue: `≤ ${maxU} W/(m²·K) (${ctx.climateZone})`,
          note: "Window thermal performance survey required",
          noteZh: "需检测或核算外窗传热系数",
        };
      }
      const compliant = uValue <= maxU;
      return {
        status: compliant ? "compliant" : "non_compliant",
        actualValue: `${uValue} W/(m²·K)`,
        requiredValue: `≤ ${maxU} W/(m²·K)`,
        note: compliant ? "Meets energy efficiency requirement" : "Exceeds maximum U-value",
        noteZh: compliant ? "满足节能限值" : "超出传热系数限值",
        remediation: compliant ? undefined : "Replace windows with double or triple glazing",
      };
    },
  },
];
