import type { DiagnosisItem, ProjectWithRelations } from "@/types";
import { bi, type BilingualString } from "@/lib/i18n/bilingual";
import {
  AUTHENTICITY_FACTORS,
  HERITAGE_GUIDELINES,
} from "../knowledge/heritage-guidelines";

export interface HeritageAssessmentInput {
  hasProtectedFacade?: boolean;
  hasHistoricInterior?: boolean;
  interventionScope?: "facade_only" | "partial_interior" | "full_adaptive_reuse";
}

export interface HeritageAuthenticityScore {
  factor: string;
  labelEn: string;
  labelZh: string;
  score: number;
  noteEn: string;
  noteZh: string;
}

export interface HeritageAssessmentResult {
  heritageLevel: string;
  overallRisk: "low" | "medium" | "high";
  authenticityScores: HeritageAuthenticityScore[];
  guidelines: typeof HERITAGE_GUIDELINES;
  reversibleInterventions: BilingualString[];
  prohibitedActions: BilingualString[];
  recommendations: BilingualString[];
}

function heritageLevelWeight(level?: string | null): number {
  switch (level) {
    case "national":
      return 1;
    case "provincial":
      return 0.85;
    case "municipal":
      return 0.7;
    case "district":
      return 0.55;
    default:
      return 0.25;
  }
}

export function assessHeritageProject(
  project: ProjectWithRelations,
  input: HeritageAssessmentInput = {}
): HeritageAssessmentResult {
  const level = project.building?.heritageLevel ?? "none";
  const weight = heritageLevelWeight(level);
  const age = new Date().getFullYear() - project.constructionYear;
  const scope = input.interventionScope ?? "partial_interior";

  const authenticityScores: HeritageAuthenticityScore[] = AUTHENTICITY_FACTORS.map((f) => {
    let score = Math.round(55 + weight * 35);
    if (f.key === "facade_fabric" && input.hasProtectedFacade) score += 10;
    if (f.key === "interior_features" && input.hasHistoricInterior) score += 8;
    if (scope === "full_adaptive_reuse") score -= 12;
    score = Math.min(98, Math.max(35, score));
    return {
      factor: f.key,
      labelEn: f.labelEn,
      labelZh: f.labelZh,
      score,
      noteEn:
        score >= 75
          ? "High preservation priority — document before design"
          : "Moderate sensitivity — coordinate with heritage consultant",
      noteZh: score >= 75 ? "保护优先级高 — 设计前须完整建档" : "中等敏感度 — 建议文保顾问协同",
    };
  });

  const overallRisk: HeritageAssessmentResult["overallRisk"] =
    weight >= 0.85 || scope === "full_adaptive_reuse"
      ? "high"
      : weight >= 0.55
        ? "medium"
        : "low";

  return {
    heritageLevel: level,
    overallRisk,
    authenticityScores,
    guidelines: HERITAGE_GUIDELINES,
    reversibleInterventions: [
      bi(
        "Detachable MEP runs in secondary zones; avoid chasing into primary heritage fabric",
        "次要区域采用可拆卸机电管线，避免在保护本体上开槽"
      ),
      bi(
        "Lightweight partition systems with reversible anchors for program adaptation",
        "功能调整优先采用轻质隔墙与可逆锚固节点"
      ),
      bi(
        "Facade cleaning and localized repair before wholesale replacement",
        "立面优先清洗与局部修缮，避免整体替换"
      ),
    ],
    prohibitedActions: [
      bi(
        "Unauthorized demolition of protected roof forms, timber brackets, or streetscape elements",
        "禁止擅自拆除保护屋顶形制、木作斗栱或街巷风貌要素"
      ),
      bi(
        "Irreversible structural cuts without heritage impact assessment",
        "未经影响评估不得对保护本体做不可逆结构开洞"
      ),
    ],
    recommendations: [
      bi(
        `Building age ${age}y — prepare condition survey and heritage impact report before schematic design`,
        `建筑建造 ${age} 年 — 方案设计前应完成现状勘察与修缮影响说明`
      ),
      bi(
        "Engage qualified heritage design team for approval pathway with cultural relics authority",
        "建议配备文保设计团队，按文物主管部门要求履行审批程序"
      ),
    ],
  };
}

export async function generateHeritageDiagnosis(
  project: ProjectWithRelations
): Promise<DiagnosisItem[]> {
  const level = project.building?.heritageLevel ?? "none";
  if (level === "none") return [];

  const assessment = assessHeritageProject(project);
  return [
    {
      id: `heritage-${project.id}-approval`,
      projectId: project.id,
      title: "Heritage approval pathway required",
      category: "heritage",
      severity: assessment.overallRisk === "high" ? "critical" : "high",
      status: "identified",
      description:
        assessment.guidelines.find((g) => g.id === "approval")?.principleEn ??
        "Heritage renovation requires authority review.",
      evidence: `Heritage level: ${level}`,
      recommendation:
        assessment.recommendations[1]?.en ??
        "Engage heritage consultant and prepare impact assessment.",
      requiresEngineerReview: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: `heritage-${project.id}-intervention`,
      projectId: project.id,
      title: "Minimum intervention & reversibility",
      category: "heritage",
      severity: "medium",
      status: "identified",
      description: assessment.reversibleInterventions[0]?.en ?? "Prefer reversible interventions.",
      evidence: "GB 50458 / PRC Heritage Law principles",
      recommendation: assessment.reversibleInterventions[1]?.en,
      requiresEngineerReview: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
}

export const heritageAgent = {
  assessHeritageProject,
  generateHeritageDiagnosis,
};
