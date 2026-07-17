export type WebSearchDomain = "regulations" | "cases" | "cost" | "general";
export type WebSearchProviderName = "tavily" | "brave";

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
  source?: string;
  relevanceScore?: number;
}

export interface WebSearchOptions {
  domain?: WebSearchDomain;
  maxResults?: number;
  includeDomains?: string[];
  excludeDomains?: string[];
}

export interface WebSearchResponse {
  query: string;
  results: WebSearchResult[];
  provider: WebSearchProviderName | null;
  domain: WebSearchDomain;
  searchedAt: string;
  configured: boolean;
}

export interface RegulationSearchInput {
  codeRef: string;
  section?: string;
  requirement?: string;
  category?: string;
}

export interface CaseSearchInput {
  location: string;
  buildingType: string;
  targetFunction: string;
  strategyType?: string;
}

export interface CostSearchInput {
  region: string;
  buildingType: string;
  strategyType?: string;
}

function resolveProvider(): WebSearchProviderName | null {
  const explicit = process.env.WEB_SEARCH_PROVIDER?.toLowerCase();
  if (explicit === "tavily" && process.env.TAVILY_API_KEY) return "tavily";
  if (explicit === "brave" && process.env.BRAVE_SEARCH_API_KEY) return "brave";

  if (process.env.TAVILY_API_KEY) return "tavily";
  if (process.env.BRAVE_SEARCH_API_KEY) return "brave";
  return null;
}

export function isWebSearchConfigured(): boolean {
  if (process.env.WEB_SEARCH_ENABLED === "false") return false;
  return resolveProvider() !== null;
}

export function getWebSearchProvider(): WebSearchProviderName | null {
  return resolveProvider();
}

export function formatWebSearchSnippets(
  results: WebSearchResult[],
  options?: { maxItems?: number; prefix?: string }
): string {
  if (results.length === 0) return "";

  const maxItems = options?.maxItems ?? 3;
  const prefix = options?.prefix ?? "Web reference";
  const lines = results.slice(0, maxItems).map((r) => {
    const snippet = r.snippet.replace(/\s+/g, " ").slice(0, 120);
    return `${prefix}: ${r.title} — ${snippet} (${r.url})`;
  });

  return lines.join(" · ");
}

export function formatWebSearchBlock(
  response: WebSearchResponse,
  heading = "Web Search Results"
): string {
  if (response.results.length === 0) {
    return `## ${heading}\nNo live web results returned. Configure TAVILY_API_KEY or BRAVE_SEARCH_API_KEY to enable online lookup.`;
  }

  const lines = response.results.map((r, i) => {
    const date = r.publishedDate ? ` (${r.publishedDate})` : "";
    return `${i + 1}. **${r.title}**${date} — ${r.snippet.slice(0, 180)} [${r.source ?? "source"}](${r.url})`;
  });

  return `## ${heading} (provider: ${response.provider}, ${response.searchedAt})
DISCLAIMER: Verify against official published standards before compliance decisions.

${lines.join("\n")}`;
}
