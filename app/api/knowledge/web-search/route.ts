import { NextResponse } from "next/server";
import {
  getWebSearchProvider,
  isWebSearchConfigured,
  searchWeb,
  type WebSearchDomain,
} from "@/lib/ai/knowledge/web-search.server";

const VALID_DOMAINS = new Set<WebSearchDomain>(["regulations", "cases", "cost", "general"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const domainParam = searchParams.get("domain") ?? "general";
  const limit = Math.min(Number(searchParams.get("limit") ?? "5"), 10);

  if (!q.trim()) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  const domain = VALID_DOMAINS.has(domainParam as WebSearchDomain)
    ? (domainParam as WebSearchDomain)
    : "general";

  if (!isWebSearchConfigured()) {
    return NextResponse.json(
      {
        error: "Web search is not configured",
        hint: "Set TAVILY_API_KEY or BRAVE_SEARCH_API_KEY in environment",
        configured: false,
      },
      { status: 503 }
    );
  }

  const result = await searchWeb(q, { domain, maxResults: limit });

  return NextResponse.json({
    ...result,
    provider: getWebSearchProvider(),
  });
}
