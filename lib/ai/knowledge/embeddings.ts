import "server-only";

import { OpenAIEmbeddings } from "@langchain/openai";
import { tokenizeForVector } from "./vector-index";
import { resolveModel } from "../model-router";

const EMBEDDING_DIM = 384;

/** Deterministic pseudo-embedding for mock/offline mode (384-dim). */
export function hashEmbedding(text: string): number[] {
  const tokens = tokenizeForVector(text);
  const vec = new Array(EMBEDDING_DIM).fill(0);

  for (const token of tokens) {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = (hash * 31 + token.charCodeAt(i)) >>> 0;
    }
    const idx = hash % EMBEDDING_DIM;
    vec[idx] += 1;
  }

  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

export function isEmbeddingsConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY && process.env.AI_SERVICE === "openai");
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (isEmbeddingsConfigured()) {
    const embeddings = new OpenAIEmbeddings({
      model: resolveModel("embedding"),
      apiKey: process.env.OPENAI_API_KEY,
    });
    return embeddings.embedDocuments(texts);
  }
  return texts.map(hashEmbedding);
}

export async function embedQuery(query: string): Promise<number[]> {
  if (isEmbeddingsConfigured()) {
    const embeddings = new OpenAIEmbeddings({
      model: resolveModel("embedding"),
      apiKey: process.env.OPENAI_API_KEY,
    });
    return embeddings.embedQuery(query);
  }
  return hashEmbedding(query);
}

export { EMBEDDING_DIM };
