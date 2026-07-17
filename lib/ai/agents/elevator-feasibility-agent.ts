import type { ProjectWithRelations } from "@/types";
import type { BimRoomInfo } from "@/types/bim";
import type { ElevatorFeasibilityResult } from "@/types/elevator-feasibility";
import { findElevatorCandidateSpaces } from "@/lib/bim/elevator-candidate-finder";
import { runComplianceEngine } from "@/lib/ai/compliance/engine";
import { assessStructuralSafety } from "@/lib/ai/agents/structural-agent";
import { hasHeritageConstraints } from "@/lib/ai/compliance/scenario-resolver";
import {
  ELEVATOR_SHAFT_MIN_DEPTH_M,
  ELEVATOR_SHAFT_MIN_WIDTH_M,
  ELEVATOR_TYPICAL_SELF_WEIGHT_KG,
} from "@/lib/ai/compliance/rules/elevator-constants";
import { hasElevatorIntent } from "@/lib/ai/compliance/elevator-intent";
import { shaftDimensionsMeetMinimum } from "@/lib/ai/compliance/rules/elevator-dimensions";
import { buildElevatorRecommendationPrompt } from "@/lib/ai/prompts";
import { chatCompletion } from "@/lib/ai/openai-client";

export interface AssessElevatorFeasibilityOptions {
  existingLoad?: number;
  skipAiRecommendation?: boolean;
}

function mapComplianceChecks(
  checks: Array<{ ruleId: string; status: string; note: string; noteZh?: string }>
) {
  return checks
    .filter((c) =>
      ["elevator-shaft-dimensions", "elevator-lobby-space", "elevator-heritage-review"].includes(
        c.ruleId
      )
    )
    .map((c) => ({
      ruleId: c.ruleId,
      status: c.status,
      note: c.noteZh ?? c.note,
    }));
}

function deriveVerdict(input: {
  hasBimData: boolean;
  spaceMeetsMinimum: boolean;
  structuralCompliant: boolean | "unknown";
  hasHeritageReview: boolean;
  hasVerificationGaps: boolean;
}): ElevatorFeasibilityResult["verdict"] {
  if (!input.hasBimData) return "insufficient_data";
  if (!input.spaceMeetsMinimum) return "infeasible";
  if (input.structuralCompliant === false) return "infeasible";
  if (input.hasHeritageReview || input.hasVerificationGaps || input.structuralCompliant === "unknown") {
    return "conditional";
  }
  return "feasible";
}

export async function assessElevatorFeasibility(
  project: ProjectWithRelations,
  rooms: BimRoomInfo[],
  options: AssessElevatorFeasibilityOptions = {}
): Promise<ElevatorFeasibilityResult> {
  const generatedAt = new Date().toISOString();

  if (!hasElevatorIntent(project)) {
    return {
      verdict: "insufficient_data",
      spaceCheck: {
        meetsMinimum: false,
        note: "项目未标识加装电梯意图，无法开展电梯可行性判断",
      },
      structuralCheck: { compliant: "unknown", note: "未触发电梯加装场景" },
      complianceChecks: [],
      generatedAt,
    };
  }

  if (!rooms.length) {
    return {
      verdict: "insufficient_data",
      spaceCheck: {
        meetsMinimum: false,
        note: "缺少BIM/平面图房间数据，无法识别候选井道空间",
      },
      structuralCheck: { compliant: "unknown", note: "无空间数据，结构荷载未核算" },
      complianceChecks: [],
      generatedAt,
    };
  }

  const candidates = findElevatorCandidateSpaces(rooms);

  if (!candidates.length) {
    return {
      verdict: "infeasible",
      spaceCheck: {
        meetsMinimum: false,
        note: "未找到满足基本尺寸条件的候选空间（无符合关键词或面积/形状要求的房间）",
      },
      structuralCheck: { compliant: "unknown", note: "无候选空间，未进行结构荷载核算" },
      complianceChecks: [],
      generatedAt,
    };
  }

  const top = candidates[0];
  const meetsMinimum = shaftDimensionsMeetMinimum(top.width, top.depth);

  const spaceNote = meetsMinimum
    ? `候选空间「${top.label}」尺寸 ${top.width.toFixed(2)}m × ${top.depth.toFixed(2)}m，满足最小井道要求（≥${ELEVATOR_SHAFT_MIN_WIDTH_M}m × ${ELEVATOR_SHAFT_MIN_DEPTH_M}m）`
    : `候选空间「${top.label}」尺寸 ${top.width.toFixed(2)}m × ${top.depth.toFixed(2)}m，未达到最小井道要求（需 ≥${ELEVATOR_SHAFT_MIN_WIDTH_M}m × ${ELEVATOR_SHAFT_MIN_DEPTH_M}m）`;

  const measurements = {
    candidateShaftWidth: top.width,
    candidateShaftDepth: top.depth,
    hasLobbySpace: undefined as boolean | undefined,
    existingLoadKN: options.existingLoad,
    targetLoadKN: options.existingLoad
      ? options.existingLoad + ELEVATOR_TYPICAL_SELF_WEIGHT_KG / project.grossFloorArea
      : undefined,
  };

  const complianceReport = runComplianceEngine(project, { measurements });
  const complianceChecks = mapComplianceChecks(complianceReport.checks);

  const shaftCheck = complianceReport.checks.find((c) => c.ruleId === "elevator-shaft-dimensions");
  const lobbyCheck = complianceReport.checks.find((c) => c.ruleId === "elevator-lobby-space");
  const heritageCheck = complianceReport.checks.find((c) => c.ruleId === "elevator-heritage-review");

  let structuralCheck: ElevatorFeasibilityResult["structuralCheck"] = {
    compliant: "unknown",
    note: "未提供现有活荷载数据，结构荷载核算待现场检测后确认",
  };

  if (options.existingLoad != null) {
    const shaftFootprint = Math.max(top.width * top.depth, 1);
    const additionalLoadPerSqm = ELEVATOR_TYPICAL_SELF_WEIGHT_KG / shaftFootprint;
    const targetLoad = options.existingLoad + additionalLoadPerSqm;
    const assessment = await assessStructuralSafety(project, {
      existingLoad: options.existingLoad,
      targetLoad,
    });
    if (assessment.loadCapacityCheck) {
      const note = assessment.loadCapacityCheck.note;
      structuralCheck = {
        compliant: assessment.loadCapacityCheck.compliant,
        note: typeof note === "string" ? note : note.zh,
      };
    }
  }

  const heritageFlag =
    heritageCheck || hasHeritageConstraints(project)
      ? {
          requiresApproval: true,
          note:
            heritageCheck?.noteZh ??
            heritageCheck?.note ??
            "文保建筑加装电梯涉及外观改动，须报文物主管部门审批",
        }
      : undefined;

  const hasVerificationGaps = [shaftCheck, lobbyCheck].some(
    (c) => c?.status === "requires_verification"
  );

  const verdict = deriveVerdict({
    hasBimData: true,
    spaceMeetsMinimum: meetsMinimum && shaftCheck?.status !== "non_compliant",
    structuralCompliant: structuralCheck.compliant,
    hasHeritageReview: Boolean(heritageFlag?.requiresApproval),
    hasVerificationGaps,
  });

  const result: ElevatorFeasibilityResult = {
    verdict,
    spaceCheck: {
      candidateRoomId: top.roomId,
      candidateLabel: top.label,
      width: top.width,
      depth: top.depth,
      meetsMinimum,
      note: spaceNote,
    },
    structuralCheck,
    complianceChecks,
    heritageFlag,
    generatedAt,
  };

  if (
    !options.skipAiRecommendation &&
    (verdict === "feasible" || verdict === "conditional")
  ) {
    try {
      const prompt = buildElevatorRecommendationPrompt(project, result);
      result.aiRecommendation = await chatCompletion(
        [
          {
            role: "system",
            content:
              "你是既有建筑改造建筑师。仅基于已给定的硬约束条件提供设计建议，不得重新判断可行性或建议其他井道位置。用中文回答，简洁专业。",
          },
          { role: "user", content: prompt },
        ],
        { scenario: "reasoning", temperature: 0.4, maxTokens: 800 }
      );
    } catch {
      result.aiRecommendation = undefined;
    }
  }

  return result;
}
