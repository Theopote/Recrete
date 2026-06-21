import { NextResponse } from "next/server";
import { searchKnowledgeAsync } from "@/lib/ai/knowledge/embedding-search";
import { isPineconeConfigured } from "@/lib/ai/knowledge/pinecone-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const limit = Number(searchParams.get("limit") ?? "8");

  if (!q.trim()) {
    return NextResponse.json({ results: [] });
  }

  const results = await searchKnowledgeAsync(q, { limit: Math.min(limit, 20) });
  return NextResponse.json({
    query: q,
    results,
    backend: isPineconeConfigured() ? "pinecone+hybrid" : "local-hybrid",
  });
}
