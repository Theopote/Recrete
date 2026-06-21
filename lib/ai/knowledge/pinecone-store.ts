import "server-only";

import { Pinecone } from "@pinecone-database/pinecone";
import type { KnowledgeSearchResult, KnowledgeSourceType } from "./embedding-search";
import { embedQuery, embedTexts } from "./embeddings";
import type { IndexedDocument } from "./vector-index";

const INDEX_NAME = process.env.PINECONE_INDEX ?? "recrete-knowledge";
const NAMESPACE = process.env.PINECONE_NAMESPACE ?? "default";

export function isPineconeConfigured(): boolean {
  return Boolean(process.env.PINECONE_API_KEY);
}

function getClient() {
  if (!process.env.PINECONE_API_KEY) {
    throw new Error("PINECONE_API_KEY is not configured");
  }
  return new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
}

export async function upsertKnowledgeDocuments(documents: IndexedDocument[]): Promise<number> {
  if (!isPineconeConfigured() || documents.length === 0) return 0;

  const pc = getClient();
  const index = pc.index(INDEX_NAME);
  const vectors = await embedTexts(documents.map((d) => d.text));

  const records = documents.map((doc, i) => ({
    id: `${doc.sourceType}:${doc.id}`,
    values: vectors[i],
    metadata: {
      sourceType: doc.sourceType,
      docId: doc.id,
      title: doc.title.slice(0, 500),
      excerpt: doc.excerpt.slice(0, 1000),
      ...(doc.metadata ?? {}),
    },
  }));

  const batchSize = 50;
  for (let i = 0; i < records.length; i += batchSize) {
    await index.namespace(NAMESPACE).upsert(records.slice(i, i + batchSize));
  }

  return records.length;
}

export async function searchPineconeKnowledge(
  query: string,
  options: { limit?: number; sourceTypes?: KnowledgeSourceType[] } = {}
): Promise<KnowledgeSearchResult[]> {
  const { limit = 5, sourceTypes = ["case", "knowledge", "code"] } = options;
  if (!isPineconeConfigured() || !query.trim()) return [];

  const pc = getClient();
  const index = pc.index(INDEX_NAME);
  const vector = await embedQuery(query);

  const filter =
    sourceTypes.length < 3
      ? { sourceType: { $in: sourceTypes } }
      : undefined;

  const response = await index.namespace(NAMESPACE).query({
    vector,
    topK: limit,
    includeMetadata: true,
    filter,
  });

  return (response.matches ?? [])
    .filter((m) => m.metadata && typeof m.metadata.title === "string")
    .map((match) => ({
      id: String(match.metadata!.docId ?? match.id),
      sourceType: match.metadata!.sourceType as KnowledgeSourceType,
      title: String(match.metadata!.title),
      excerpt: String(match.metadata!.excerpt ?? ""),
      relevance: match.score ?? 0,
      metadata: Object.fromEntries(
        Object.entries(match.metadata ?? {}).filter(
          ([k]) => !["sourceType", "docId", "title", "excerpt"].includes(k)
        )
      ) as Record<string, string | number>,
    }));
}

export async function getPineconeIndexStats() {
  if (!isPineconeConfigured()) return null;
  const pc = getClient();
  const index = pc.index(INDEX_NAME);
  return index.describeIndexStats();
}
