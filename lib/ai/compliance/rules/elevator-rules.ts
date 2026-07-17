import type { ComplianceRuleDefinition } from "../types";
import { bi } from "@/lib/i18n/bilingual";
import { hasHeritageConstraints } from "../scenario-resolver";
import {
  ELEVATOR_LOBBY_MIN_DEPTH_M,
  ELEVATOR_SHAFT_MIN_DEPTH_M,
  ELEVATOR_SHAFT_MIN_WIDTH_M,
} from "./elevator-constants";
import { hasElevatorIntent } from "../elevator-intent";
import { shaftDimensionsMeetMinimum } from "./elevator-dimensions";

export const elevatorRules: ComplianceRuleDefinition[] = [
  {
    id: "elevator-shaft-dimensions",
    codeId: "elevator_design_code",
    codeRef: "待补充规范编号",
    section: "—",
    category: "accessibility",
    requirement: "Minimum elevator shaft dimensions",
    requirementZh: "电梯井道最小尺寸",
    priority: "high",
    scenarios: ["elevator_addition", "function_conversion", "public_building_renovation"],
    applies: (ctx) => hasElevatorIntent(ctx.project),
    evaluate: (ctx) => {
      const width = ctx.measurements.candidateShaftWidth;
      const depth = ctx.measurements.candidateShaftDepth;
      const required = `${ELEVATOR_SHAFT_MIN_WIDTH_M}m × ${ELEVATOR_SHAFT_MIN_DEPTH_M}m`;

      if (width == null || depth == null) {
        return {
          status: "requires_verification" as const,
          requiredValue: required,
          note: "Candidate shaft width/depth not measured — verify on site or from BIM",
          noteZh: "候选井道宽/深未测量，须现场或BIM核实",
        };
      }

      const meets = shaftDimensionsMeetMinimum(width, depth);

      return {
        status: meets ? ("compliant" as const) : ("non_compliant" as const),
        actualValue: `${width.toFixed(2)}m × ${depth.toFixed(2)}m`,
        requiredValue: required,
        note: meets
          ? `Candidate shaft ${width.toFixed(2)}m × ${depth.toFixed(2)}m meets minimum`
          : `Candidate shaft ${width.toFixed(2)}m × ${depth.toFixed(2)}m below minimum ${required}`,
        noteZh: meets
          ? `候选井道 ${width.toFixed(2)}m × ${depth.toFixed(2)}m 满足最小要求`
          : `候选井道 ${width.toFixed(2)}m × ${depth.toFixed(2)}m 未达到最小要求 ${required}`,
        remediation: meets
          ? undefined
          : bi(
              "Select a larger candidate space or consider external shaft addition",
              "选择更大候选空间或考虑外挂井道方案"
            ),
      };
    },
  },
  {
    id: "elevator-lobby-space",
    codeId: "gb50763_accessibility",
    codeRef: "GB 50763-2012",
    section: "3.7.3",
    category: "accessibility",
    requirement: "Elevator lobby depth",
    requirementZh: "候梯厅最小深度",
    priority: "medium",
    scenarios: ["elevator_addition", "public_building_renovation"],
    applies: (ctx) => hasElevatorIntent(ctx.project),
    evaluate: (ctx) => {
      const hasLobby = ctx.measurements.hasLobbySpace;
      const lobbyDepth = ctx.measurements.lobbyDepth;
      const required = `${ELEVATOR_LOBBY_MIN_DEPTH_M}m`;

      if (hasLobby === undefined && lobbyDepth == null) {
        return {
          status: "requires_verification" as const,
          requiredValue: required,
          note: "Lobby space not confirmed — verify turning radius and depth on site",
          noteZh: "候梯厅空间未确认，须现场核实回转半径与深度",
        };
      }

      if (lobbyDepth != null) {
        const meets = lobbyDepth >= ELEVATOR_LOBBY_MIN_DEPTH_M;
        return {
          status: meets ? ("compliant" as const) : ("non_compliant" as const),
          actualValue: `${lobbyDepth.toFixed(2)}m`,
          requiredValue: required,
          note: meets
            ? `Lobby depth ${lobbyDepth.toFixed(2)}m meets minimum`
            : `Lobby depth ${lobbyDepth.toFixed(2)}m below minimum ${required}`,
          noteZh: meets
            ? `候梯厅深度 ${lobbyDepth.toFixed(2)}m 满足最小要求`
            : `候梯厅深度 ${lobbyDepth.toFixed(2)}m 未达到最小要求 ${required}`,
        };
      }

      return {
        status: hasLobby ? ("compliant" as const) : ("requires_verification" as const),
        actualValue: hasLobby ? "Provided" : "Not confirmed",
        requiredValue: required,
        note: hasLobby
          ? "Lobby space indicated — confirm depth meets wheelchair turning requirement"
          : "Lobby space not confirmed",
        noteZh: hasLobby
          ? "已标识候梯厅空间，须确认深度满足轮椅回转要求"
          : "候梯厅空间未确认",
      };
    },
  },
  {
    id: "elevator-heritage-review",
    codeId: "prc_heritage_law",
    codeRef: "文物保护法 2024",
    section: "Art. 21",
    category: "heritage",
    requirement: "Heritage elevator addition review",
    requirementZh: "文保建筑加装电梯专项审批",
    priority: "critical",
    scenarios: ["heritage_renovation", "historic_building", "elevator_addition"],
    applies: (ctx) => hasHeritageConstraints(ctx.project) && hasElevatorIntent(ctx.project),
    evaluate: () => ({
      status: "requires_verification" as const,
      requiredValue: "Heritage authority approval for facade/shaft intervention",
      note: "Heritage building elevator addition involves facade changes — submit to cultural relics authority for专项论证",
      noteZh:
        "文保建筑加装电梯涉及外观改动，须报文物主管部门审批，具体位置和井道形式需专项论证",
      remediation: bi(
        "Prepare heritage impact assessment for elevator shaft location and facade treatment",
        "编制加装电梯位置与立面处理的影响说明并报审"
      ),
    }),
  },
];
