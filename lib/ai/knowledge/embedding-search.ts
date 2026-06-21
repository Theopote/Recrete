import { knowledgeArticles } from "@/lib/mock-data/knowledge";
import { buildingCodes } from "./code-database";
import { renovationCases, type RenovationCase } from "./case-library";

export type KnowledgeSourceType = "case" | "knowledge" | "code";

export interface KnowledgeSearchResult {
  id: string;
  sourceType: KnowledgeSourceType;
  title: string;
  excerpt: string;
  relevance: number;
  metadata?: Record<string, string | number>;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,，。；;、/\-–—]+/)
    .filter((t) => t.length > 1);
}

function scoreMatch(queryTokens: string[], corpus: string): number {
  const corpusLower = corpus.toLowerCase();
  let score = 0;
  for (const token of queryTokens) {
    if (corpusLower.includes(token)) score += 1;
  }
  return score / Math.max(queryTokens.length, 1);
}

function buildCaseCorpus(c: RenovationCase): string {
  return [
    c.title,
    c.location,
    c.buildingType,
    c.originalFunction,
    c.targetFunction,
    c.strategyType,
    c.summary,
    ...c.lessons,
    ...c.tags,
  ].join(" ");
}

export function searchKnowledge(
  query: string,
  options: { limit?: number; sourceTypes?: KnowledgeSourceType[] } = {}
): KnowledgeSearchResult[] {
  const { limit = 5, sourceTypes = ["case", "knowledge", "code"] } = options;
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const results: KnowledgeSearchResult[] = [];

  if (sourceTypes.includes("case")) {
    for (const c of renovationCases) {
      const relevance = scoreMatch(queryTokens, buildCaseCorpus(c));
      if (relevance > 0) {
        results.push({
          id: c.id,
          sourceType: "case",
          title: c.title,
          excerpt: `${c.summary} Cost: ~¥${c.costPerSqm?.toLocaleString() ?? "N/A"}/sqm · ${c.durationMonths ?? "?"} months.`,
          relevance,
          metadata: {
            costPerSqm: c.costPerSqm ?? 0,
            durationMonths: c.durationMonths ?? 0,
          },
        });
      }
    }
  }

  if (sourceTypes.includes("knowledge")) {
    for (const article of knowledgeArticles) {
      const corpus = [article.title, article.category, article.summary, article.content, ...article.tags].join(" ");
      const relevance = scoreMatch(queryTokens, corpus);
      if (relevance > 0) {
        results.push({
          id: article.id,
          sourceType: "knowledge",
          title: article.title,
          excerpt: article.summary,
          relevance,
        });
      }
    }
  }

  if (sourceTypes.includes("code")) {
    for (const code of buildingCodes) {
      const corpus = [
        code.id,
        code.title,
        code.category,
        code.description,
        ...code.requirements.map((r) => `${r.section} ${r.title} ${r.description}`),
      ].join(" ");
      const relevance = scoreMatch(queryTokens, corpus) * 0.9;
      if (relevance > 0) {
        results.push({
          id: code.id,
          sourceType: "code",
          title: code.title,
          excerpt: code.description,
          relevance,
        });
      }
    }
  }

  return results
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);
}

export function searchKnowledgeForProject(
  project: {
    name: string;
    location: string;
    buildingType: string;
    currentFunction: string;
    targetFunction: string;
    renovationGoal: string;
    structureType: string;
  },
  userQuery?: string,
  limit = 5
): KnowledgeSearchResult[] {
  const baseQuery = [
    project.buildingType,
    project.currentFunction,
    project.targetFunction,
    project.location,
    project.structureType,
    project.renovationGoal,
    userQuery ?? "",
  ].join(" ");

  return searchKnowledge(baseQuery, { limit });
}
