import "server-only";

import type { ProjectWithRelations } from "@/types";
import type { KnowledgeSnippet } from "@/types/ai";
import type { SourceEvidence } from "@/types/ai";
import {
  searchKnowledgeAsync,
  searchKnowledgeForProjectAsync,
  type KnowledgeSearchResult,
} from "./embedding-search";

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,，。；;、/\-–—]+/)
    .filter((t) => t.length > 1);
}

function scoreText(queryTokens: string[], corpus: string): number {
  if (queryTokens.length === 0) return 0;
  const lower = corpus.toLowerCase();
  let hits = 0;
  for (const token of queryTokens) {
    if (lower.includes(token)) hits += 1;
  }
  return hits / queryTokens.length;
}

function buildCopilotQuery(project: ProjectWithRelations, userQuery: string): string {
  const parts = [
    userQuery.trim(),
    project.targetFunction,
    project.currentFunction,
    project.buildingType,
    project.structureType,
    project.location,
    project.renovationGoal,
    project.buildingMemory?.keyRisks.slice(0, 3).join(" ") ?? "",
    project.buildingMemory?.missingInformation.slice(0, 2).join(" ") ?? "",
  ].filter(Boolean);
  return parts.join(" ");
}

function toSnippet(result: KnowledgeSearchResult): KnowledgeSnippet {
  return {
    id: result.id,
    sourceType: result.sourceType,
    title: result.title,
    excerpt: result.excerpt,
    relevance: result.relevance,
  };
}

function retrieveProjectDocumentSnippets(
  project: ProjectWithRelations,
  queryTokens: string[],
  limit: number
): KnowledgeSnippet[] {
  const docs = project.documents ?? [];
  const snippets: KnowledgeSnippet[] = [];

  for (const doc of docs) {
    const corpus = [doc.name, doc.category, doc.aiSummary ?? "", doc.extractedText?.slice(0, 2000) ?? ""].join(
      " "
    );
    const relevance = scoreText(queryTokens, corpus);
    if (relevance <= 0 && !doc.aiSummary) continue;

    const excerpt =
      doc.aiSummary?.slice(0, 220) ??
      doc.extractedText?.slice(0, 220) ??
      `${doc.category} document`;

    snippets.push({
      id: doc.id,
      sourceType: "project_doc",
      title: doc.name,
      excerpt,
      relevance: relevance + (doc.aiSummary ? 0.15 : 0),
    });
  }

  return snippets.sort((a, b) => b.relevance - a.relevance).slice(0, limit);
}

export function rankEvidenceByQuery(
  evidence: SourceEvidence[],
  userQuery: string,
  limit = 6
): SourceEvidence[] {
  const queryTokens = tokenize(userQuery);
  if (queryTokens.length === 0) return evidence.slice(0, limit);

  return [...evidence]
    .map((item) => ({
      item,
      score: scoreText(
        queryTokens,
        [item.locationLabel ?? "", item.quote ?? "", item.sourceType].join(" ")
      ),
    }))
    .sort((a, b) => b.score - a.score)
    .filter((row) => row.score > 0 || evidence.length <= limit)
    .slice(0, limit)
    .map((row) => row.item);
}

export interface CopilotRagResult {
  knowledgeSnippets: KnowledgeSnippet[];
  evidence: SourceEvidence[];
  query: string;
}

/**
 * Hybrid RAG for Copilot: project-aware knowledge retrieval + document/evidence ranking.
 */
export async function retrieveCopilotRagContext(input: {
  project: ProjectWithRelations;
  userQuery?: string;
  evidence?: SourceEvidence[];
  knowledgeLimit?: number;
  documentLimit?: number;
}): Promise<CopilotRagResult> {
  const {
    project,
    userQuery = "",
    evidence = [],
    knowledgeLimit = 5,
    documentLimit = 3,
  } = input;

  const query = buildCopilotQuery(project, userQuery);
  const queryTokens = tokenize(query);

  const [globalKnowledge, targetedKnowledge] = await Promise.all([
    searchKnowledgeForProjectAsync(project, userQuery, knowledgeLimit),
    userQuery.trim()
      ? searchKnowledgeAsync(userQuery, { limit: knowledgeLimit, mode: "hybrid" })
      : Promise.resolve([] as KnowledgeSearchResult[]),
  ]);

  const documentSnippets = retrieveProjectDocumentSnippets(project, queryTokens, documentLimit);
  const rankedEvidence = rankEvidenceByQuery(evidence, userQuery, 6);

  const merged = new Map<string, KnowledgeSnippet>();
  for (const item of [...globalKnowledge, ...targetedKnowledge].map(toSnippet)) {
    const key = `${item.sourceType}:${item.id}`;
    const existing = merged.get(key);
    merged.set(
      key,
      existing && existing.relevance >= item.relevance ? existing : item
    );
  }
  for (const doc of documentSnippets) {
    merged.set(`project_doc:${doc.id}`, doc);
  }

  const knowledgeSnippets = [...merged.values()]
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, knowledgeLimit + documentLimit);

  return {
    knowledgeSnippets,
    evidence: rankedEvidence.length > 0 ? rankedEvidence : evidence.slice(0, 6),
    query,
  };
}
