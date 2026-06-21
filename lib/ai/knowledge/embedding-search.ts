import { knowledgeArticles } from "@/lib/mock-data/knowledge";
import { buildingCodes } from "./code-database";
import { renovationCases, type RenovationCase } from "./case-library";
import {
  searchIndexedDocuments,
  type IndexedDocument,
} from "./vector-index";
import {
  isPineconeConfigured,
  searchPineconeKnowledge,
} from "./pinecone-store";

export type KnowledgeSourceType = "case" | "knowledge" | "code";

export interface KnowledgeSearchResult {
  id: string;
  sourceType: KnowledgeSourceType;
  title: string;
  excerpt: string;
  relevance: number;
  metadata?: Record<string, string | number>;
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

let cachedIndex: IndexedDocument[] | null = null;

export function getKnowledgeIndexForSync(): IndexedDocument[] {
  return getKnowledgeIndex();
}

function getKnowledgeIndex(): IndexedDocument[] {
  if (cachedIndex) return cachedIndex;

  cachedIndex = [
    ...renovationCases.map((c) => ({
      id: c.id,
      sourceType: "case" as const,
      title: c.title,
      excerpt: `${c.summary} Cost: ~¥${c.costPerSqm?.toLocaleString() ?? "N/A"}/sqm · ${c.durationMonths ?? "?"} months.`,
      text: buildCaseCorpus(c),
      metadata: { costPerSqm: c.costPerSqm ?? 0, durationMonths: c.durationMonths ?? 0 },
    })),
    ...knowledgeArticles.map((article) => ({
      id: article.id,
      sourceType: "knowledge" as const,
      title: article.title,
      excerpt: article.summary,
      text: [article.title, article.category, article.summary, article.content, ...article.tags].join(" "),
    })),
    ...buildingCodes.map((code) => ({
      id: code.id,
      sourceType: "code" as const,
      title: code.name,
      excerpt: `${code.code} — ${code.keyRequirements[0]?.title ?? code.category}`,
      text: [
        code.id,
        code.name,
        code.nameZh,
        code.code,
        code.category,
        ...code.keyRequirements.map((r) => `${r.section} ${r.title} ${r.titleZh} ${r.description}`),
      ].join(" "),
    })),
  ];

  return cachedIndex;
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

function keywordSearch(
  query: string,
  options: { limit?: number; sourceTypes?: KnowledgeSourceType[] } = {}
): KnowledgeSearchResult[] {
  const { limit = 5, sourceTypes = ["case", "knowledge", "code"] } = options;
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  return getKnowledgeIndex()
    .filter((doc) => sourceTypes.includes(doc.sourceType))
    .map((doc) => ({
      id: doc.id,
      sourceType: doc.sourceType,
      title: doc.title,
      excerpt: doc.excerpt,
      relevance: scoreMatch(queryTokens, doc.text) * (doc.sourceType === "code" ? 0.9 : 1),
      metadata: doc.metadata,
    }))
    .filter((r) => r.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);
}

export function searchKnowledge(
  query: string,
  options: { limit?: number; sourceTypes?: KnowledgeSourceType[]; mode?: "vector" | "keyword" | "hybrid" } = {}
): KnowledgeSearchResult[] {
  return searchKnowledgeSync(query, options);
}

function searchKnowledgeSync(
  query: string,
  options: { limit?: number; sourceTypes?: KnowledgeSourceType[]; mode?: "vector" | "keyword" | "hybrid" } = {}
): KnowledgeSearchResult[] {
  const { limit = 5, sourceTypes = ["case", "knowledge", "code"], mode = "hybrid" } = options;
  if (!query.trim()) return [];

  const index = getKnowledgeIndex().filter((doc) => sourceTypes.includes(doc.sourceType));

  if (mode === "keyword") {
    return keywordSearch(query, { limit, sourceTypes });
  }

  const vectorResults = searchIndexedDocuments(query, index, limit);

  if (mode === "vector") {
    return vectorResults;
  }

  const keywordResults = keywordSearch(query, { limit, sourceTypes });
  const merged = new Map<string, KnowledgeSearchResult>();

  for (const r of vectorResults) {
    merged.set(`${r.sourceType}:${r.id}`, { ...r, relevance: r.relevance * 1.2 });
  }
  for (const r of keywordResults) {
    const key = `${r.sourceType}:${r.id}`;
    const existing = merged.get(key);
    merged.set(
      key,
      existing
        ? { ...existing, relevance: Math.max(existing.relevance, r.relevance) }
        : r
    );
  }

  return [...merged.values()]
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);
}

/** Async search — uses Pinecone when configured, otherwise falls back to local hybrid search. */
export async function searchKnowledgeAsync(
  query: string,
  options: { limit?: number; sourceTypes?: KnowledgeSourceType[]; mode?: "vector" | "keyword" | "hybrid" } = {}
): Promise<KnowledgeSearchResult[]> {
  const { limit = 5, sourceTypes = ["case", "knowledge", "code"], mode = "hybrid" } = options;
  if (!query.trim()) return [];

  if (isPineconeConfigured() && mode !== "keyword") {
    try {
      const pineconeResults = await searchPineconeKnowledge(query, { limit, sourceTypes });
      if (pineconeResults.length > 0) {
        if (mode === "vector") return pineconeResults;
        const keywordResults = keywordSearch(query, { limit, sourceTypes });
        const merged = new Map<string, KnowledgeSearchResult>();
        for (const r of pineconeResults) {
          merged.set(`${r.sourceType}:${r.id}`, { ...r, relevance: r.relevance * 1.1 });
        }
        for (const r of keywordResults) {
          const key = `${r.sourceType}:${r.id}`;
          const existing = merged.get(key);
          merged.set(key, existing ? { ...existing, relevance: Math.max(existing.relevance, r.relevance) } : r);
        }
        return [...merged.values()].sort((a, b) => b.relevance - a.relevance).slice(0, limit);
      }
    } catch (error) {
      console.error("Pinecone search fallback:", error);
    }
  }

  return searchKnowledgeSync(query, { limit, sourceTypes, mode });
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

  return searchKnowledge(baseQuery, { limit, mode: "hybrid" });
}

export async function searchKnowledgeForProjectAsync(
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
): Promise<KnowledgeSearchResult[]> {
  const baseQuery = [
    project.buildingType,
    project.currentFunction,
    project.targetFunction,
    project.location,
    project.structureType,
    project.renovationGoal,
    userQuery ?? "",
  ].join(" ");

  return searchKnowledgeAsync(baseQuery, { limit, mode: "hybrid" });
}
