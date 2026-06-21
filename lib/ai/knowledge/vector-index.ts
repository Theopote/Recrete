import type { KnowledgeSearchResult, KnowledgeSourceType } from "./embedding-search";

export interface IndexedDocument {
  id: string;
  sourceType: KnowledgeSourceType;
  title: string;
  excerpt: string;
  text: string;
  metadata?: Record<string, string | number>;
}

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "from", "this", "that", "are", "was", "were",
  "的", "和", "与", "在", "是", "了", "为", "及",
]);

export function tokenizeForVector(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

function termFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) ?? 0) + 1);
  }
  const max = Math.max(...tf.values(), 1);
  for (const [k, v] of tf) tf.set(k, v / max);
  return tf;
}

function buildIdf(docs: IndexedDocument[]): Map<string, number> {
  const df = new Map<string, number>();
  for (const doc of docs) {
    const unique = new Set(tokenizeForVector(doc.text));
    for (const token of unique) df.set(token, (df.get(token) ?? 0) + 1);
  }
  const n = docs.length;
  const idf = new Map<string, number>();
  for (const [token, count] of df) {
    idf.set(token, Math.log(1 + n / count));
  }
  return idf;
}

function vectorize(tf: Map<string, number>, idf: Map<string, number>): Map<string, number> {
  const vec = new Map<string, number>();
  for (const [token, freq] of tf) {
    vec.set(token, freq * (idf.get(token) ?? 0));
  }
  return vec;
}

function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const [k, v] of a) {
    normA += v * v;
    if (b.has(k)) dot += v * (b.get(k) ?? 0);
  }
  for (const v of b.values()) normB += v * v;
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function searchIndexedDocuments(
  query: string,
  documents: IndexedDocument[],
  limit = 5
): KnowledgeSearchResult[] {
  if (!query.trim() || documents.length === 0) return [];

  const idf = buildIdf(documents);
  const queryVec = vectorize(termFrequency(tokenizeForVector(query)), idf);

  return documents
    .map((doc) => {
      const docVec = vectorize(termFrequency(tokenizeForVector(doc.text)), idf);
      const relevance = cosineSimilarity(queryVec, docVec);
      return {
        id: doc.id,
        sourceType: doc.sourceType,
        title: doc.title,
        excerpt: doc.excerpt,
        relevance,
        metadata: doc.metadata,
      };
    })
    .filter((r) => r.relevance > 0.05)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);
}
