import type { ProjectWithRelations } from "@/types";
import {
  getCaseById,
  renovationCases,
  type CaseOutcome,
  type RenovationCase,
} from "./case-library";
import { searchKnowledgeForProjectAsync, searchKnowledgeForProject } from "./embedding-search";

export interface SimilarCaseResult {
  id: string;
  title: string;
  location: string;
  region: string;
  outcome: CaseOutcome;
  strategyType: string;
  costPerSqm?: number;
  durationMonths?: number;
  summary: string;
  lessons: string[];
  failureReasons?: string[];
  relevance: number;
  matchReasons: string[];
}

export interface SimilarCasesResponse {
  successCases: SimilarCaseResult[];
  warningCases: SimilarCaseResult[];
  allCases: SimilarCaseResult[];
  failureWarnings: CaseFailureWarning[];
}

export interface CaseFailureWarning {
  caseId: string;
  caseTitle: string;
  title: string;
  summary: string;
  priority: "medium" | "high" | "critical";
}

const REGION_CITIES: Record<string, string[]> = {
  西北: ["西安", "xi'an", "xian", "兰州", "银川"],
  华东: ["上海", "shanghai", "杭州", "hangzhou", "南京", "苏州"],
  华北: ["北京", "beijing", "天津", "石家庄"],
  西南: ["成都", "chengdu", "重庆", "昆明"],
  华南: ["广州", "guangzhou", "深圳", "shenzhen"],
};

function inferRegion(location: string): string | null {
  const lower = location.toLowerCase();
  for (const [region, cities] of Object.entries(REGION_CITIES)) {
    if (cities.some((c) => lower.includes(c.toLowerCase()) || location.includes(c))) {
      return region;
    }
  }
  return null;
}

function scoreCaseMatch(project: ProjectWithRelations, c: RenovationCase): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const projectRegion = inferRegion(project.location);

  if (projectRegion && c.region === projectRegion) {
    score += 0.25;
    reasons.push(`同区域 (${c.region})`);
  }

  const locToken = project.location.split(/[,，]/)[0]?.trim().toLowerCase() ?? "";
  if (locToken && c.location.toLowerCase().includes(locToken)) {
    score += 0.2;
    reasons.push(`同城 (${c.location})`);
  }

  if (c.buildingType.toLowerCase() === project.buildingType.toLowerCase()) {
    score += 0.15;
    reasons.push(`同类建筑 (${c.buildingType})`);
  }

  const targetLower = project.targetFunction.toLowerCase();
  const caseTargetLower = c.targetFunction.toLowerCase();
  if (
    targetLower.includes(caseTargetLower.slice(0, 4)) ||
    caseTargetLower.includes(targetLower.slice(0, 4)) ||
    c.tags.some((t) => targetLower.includes(t.replace(/-/g, " ")))
  ) {
    score += 0.2;
    reasons.push(`目标功能相近 (${c.targetFunction})`);
  }

  if (c.structureType.toLowerCase().includes(project.structureType.toLowerCase().slice(0, 6))) {
    score += 0.1;
    reasons.push(`结构类型相近`);
  }

  const yearDelta = Math.abs(c.constructionYear - project.constructionYear);
  if (yearDelta <= 10) {
    score += 0.1;
    reasons.push(`建造年代接近 (${c.constructionYear})`);
  }

  return { score: Math.min(1, score), reasons };
}

function toSimilarCaseResult(
  c: RenovationCase,
  relevance: number,
  matchReasons: string[]
): SimilarCaseResult {
  return {
    id: c.id,
    title: c.title,
    location: c.location,
    region: c.region,
    outcome: c.outcome,
    strategyType: c.strategyType,
    costPerSqm: c.costPerSqm,
    durationMonths: c.durationMonths,
    summary: c.summary,
    lessons: c.lessons,
    failureReasons: c.failureReasons,
    relevance,
    matchReasons,
  };
}

function rankCases(project: ProjectWithRelations, limit: number): SimilarCaseResult[] {
  const ranked = renovationCases
    .map((c) => {
      const { score, reasons } = scoreCaseMatch(project, c);
      return toSimilarCaseResult(c, score, reasons);
    })
    .filter((c) => c.relevance > 0.1)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);

  return ranked;
}

function mergeWithSearchResults(
  project: ProjectWithRelations,
  ruleRanked: SimilarCaseResult[],
  searchLimit: number
): SimilarCaseResult[] {
  const searchResults = searchKnowledgeForProject(project, undefined, searchLimit).filter(
    (r) => r.sourceType === "case"
  );

  const merged = new Map<string, SimilarCaseResult>();
  for (const r of ruleRanked) {
    merged.set(r.id, r);
  }

  for (const sr of searchResults) {
    const full = getCaseById(sr.id);
    if (!full) continue;
    const existing = merged.get(sr.id);
    const hybridRelevance = existing
      ? Math.max(existing.relevance, sr.relevance * 0.85)
      : sr.relevance * 0.85;
    merged.set(
      sr.id,
      toSimilarCaseResult(
        full,
        hybridRelevance,
        existing?.matchReasons.length ? existing.matchReasons : ["语义相似匹配"]
      )
    );
  }

  return [...merged.values()].sort((a, b) => b.relevance - a.relevance);
}

export function buildFailureWarnings(cases: SimilarCaseResult[]): CaseFailureWarning[] {
  const warnings: CaseFailureWarning[] = [];

  for (const c of cases) {
    if (c.outcome !== "failure" && c.outcome !== "partial") continue;
    const reasons = c.failureReasons ?? c.lessons.filter((l) =>
      /delay|overrun|underestimat|insufficient|non-compliance|冲突|延误|超支|不足/.test(l.toLowerCase())
    );

    for (const reason of reasons.slice(0, 3)) {
      warnings.push({
        caseId: c.id,
        caseTitle: c.title,
        title: `历史教训 · ${c.title}`,
        summary: reason,
        priority: c.outcome === "failure" ? "high" : "medium",
      });
    }
  }

  return warnings.slice(0, 6);
}

export function searchSimilarCases(
  project: ProjectWithRelations,
  options: { limit?: number; includeWarnings?: boolean } = {}
): SimilarCasesResponse {
  const limit = options.limit ?? 5;
  const ruleRanked = rankCases(project, limit);
  const allCases = mergeWithSearchResults(project, ruleRanked, limit + 2).slice(0, limit);

  const successCases = allCases.filter((c) => c.outcome === "success");
  const warningCases = allCases.filter((c) => c.outcome === "failure" || c.outcome === "partial");

  return {
    successCases,
    warningCases,
    allCases,
    failureWarnings: options.includeWarnings !== false ? buildFailureWarnings(allCases) : [],
  };
}

export async function searchSimilarCasesAsync(
  project: ProjectWithRelations,
  options: { limit?: number; includeWarnings?: boolean } = {}
): Promise<SimilarCasesResponse> {
  const limit = options.limit ?? 5;
  const ruleRanked = rankCases(project, limit);

  const searchResults = (await searchKnowledgeForProjectAsync(project, undefined, limit + 2)).filter(
    (r) => r.sourceType === "case"
  );

  const merged = new Map<string, SimilarCaseResult>();
  for (const r of ruleRanked) merged.set(r.id, r);

  for (const sr of searchResults) {
    const full = getCaseById(sr.id);
    if (!full) continue;
    const existing = merged.get(sr.id);
    merged.set(
      sr.id,
      toSimilarCaseResult(
        full,
        existing ? Math.max(existing.relevance, sr.relevance * 0.9) : sr.relevance * 0.9,
        existing?.matchReasons.length ? existing.matchReasons : ["语义相似匹配"]
      )
    );
  }

  const allCases = [...merged.values()].sort((a, b) => b.relevance - a.relevance).slice(0, limit);
  const successCases = allCases.filter((c) => c.outcome === "success");
  const warningCases = allCases.filter((c) => c.outcome === "failure" || c.outcome === "partial");

  return {
    successCases,
    warningCases,
    allCases,
    failureWarnings: options.includeWarnings !== false ? buildFailureWarnings(allCases) : [],
  };
}
