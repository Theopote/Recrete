import { NextResponse } from "next/server";
import { searchKnowledge } from "@/lib/ai/knowledge/embedding-search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const limit = Number(searchParams.get("limit") ?? "8");

  if (!q.trim()) {
    return NextResponse.json({ results: [] });
  }

  const results = searchKnowledge(q, { limit: Math.min(limit, 20) });
  return NextResponse.json({ query: q, results });
}
