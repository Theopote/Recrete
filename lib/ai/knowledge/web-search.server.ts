import "server-only";

import {
  getWebSearchProvider,
  isWebSearchConfigured,
  type CaseSearchInput,
  type CostSearchInput,
  type RegulationSearchInput,
  type WebSearchDomain,
  type WebSearchOptions,
  type WebSearchProviderName,
  type WebSearchResponse,
  type WebSearchResult,
} from "./web-search";

export type {
  CaseSearchInput,
  CostSearchInput,
  RegulationSearchInput,
  WebSearchDomain,
  WebSearchOptions,
  WebSearchProviderName,
  WebSearchResponse,
  WebSearchResult,
} from "./web-search";

export { formatWebSearchBlock, formatWebSearchSnippets, getWebSearchProvider, isWebSearchConfigured } from "./web-search";

const REQUEST_TIMEOUT_MS = Number(process.env.WEB_SEARCH_TIMEOUT_MS ?? 15_000);
const DEFAULT_MAX_RESULTS = Number(process.env.WEB_SEARCH_MAX_RESULTS ?? 5);

const DOMAIN_INCLUDE_DOMAINS: Partial<Record<WebSearchDomain, string[]>> = {
  regulations: [
    "std.samr.gov.cn",
    "gov.cn",
    "mohurd.gov.cn",
    "mem.gov.cn",
    "codeofchina.com",
  ],
  cases: [],
  cost: ["zjzb.com", "cost168.com", "glodon.com", "gov.cn"],
};

const DOMAIN_QUERY_SUFFIX: Partial<Record<WebSearchDomain, string>> = {
  regulations: "现行有效 规范条文",
  cases: "改造案例 项目",
  cost: "单方造价 造价指标 2024 2025",
};

function resolveProvider(): WebSearchProviderName | null {
  return getWebSearchProvider();
}

function buildDomainQuery(query: string, domain: WebSearchDomain): string {
  const suffix = DOMAIN_QUERY_SUFFIX[domain];
  if (!suffix) return query.trim();
  return `${query.trim()} ${suffix}`.trim();
}

function emptyResponse(
  query: string,
  domain: WebSearchDomain,
  configured: boolean
): WebSearchResponse {
  return {
    query,
    results: [],
    provider: null,
    domain,
    searchedAt: new Date().toISOString(),
    configured,
  };
}

async function searchWithTavily(
  query: string,
  options: WebSearchOptions
): Promise<WebSearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return [];

  const domain = options.domain ?? "general";
  const includeDomains =
    options.includeDomains ??
    (domain !== "general" ? DOMAIN_INCLUDE_DOMAINS[domain] : undefined);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: domain === "regulations" ? "advanced" : "basic",
        max_results: options.maxResults ?? DEFAULT_MAX_RESULTS,
        include_domains: includeDomains?.length ? includeDomains : undefined,
        exclude_domains: options.excludeDomains,
        include_answer: false,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn(`[web-search] Tavily error ${response.status}`);
      return [];
    }

    const data = (await response.json()) as {
      results?: Array<{
        title?: string;
        url?: string;
        content?: string;
        score?: number;
        published_date?: string;
      }>;
    };

    return (data.results ?? []).map((row) => ({
      title: row.title ?? "Untitled",
      url: row.url ?? "",
      snippet: (row.content ?? "").slice(0, 400),
      publishedDate: row.published_date,
      source: row.url ? new URL(row.url).hostname : undefined,
      relevanceScore: row.score,
    }));
  } catch (error) {
    console.warn("[web-search] Tavily request failed:", error);
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

async function searchWithBrave(
  query: string,
  options: WebSearchOptions
): Promise<WebSearchResult[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) return [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const params = new URLSearchParams({
      q: query,
      count: String(options.maxResults ?? DEFAULT_MAX_RESULTS),
      text_decorations: "false",
      search_lang: "zh-hans",
    });

    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?${params.toString()}`,
      {
        headers: {
          Accept: "application/json",
          "X-Subscription-Token": apiKey,
        },
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      console.warn(`[web-search] Brave error ${response.status}`);
      return [];
    }

    const data = (await response.json()) as {
      web?: {
        results?: Array<{
          title?: string;
          url?: string;
          description?: string;
          age?: string;
          profile?: { name?: string };
        }>;
      };
    };

    return (data.web?.results ?? []).map((row) => ({
      title: row.title ?? "Untitled",
      url: row.url ?? "",
      snippet: (row.description ?? "").slice(0, 400),
      publishedDate: row.age,
      source: row.profile?.name ?? (row.url ? new URL(row.url).hostname : undefined),
      relevanceScore: undefined,
    }));
  } catch (error) {
    console.warn("[web-search] Brave request failed:", error);
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export async function searchWeb(
  query: string,
  options: WebSearchOptions = {}
): Promise<WebSearchResponse> {
  const domain = options.domain ?? "general";
  const trimmed = query.trim();
  if (!trimmed) return emptyResponse(trimmed, domain, isWebSearchConfigured());

  const provider = resolveProvider();
  if (!provider || process.env.WEB_SEARCH_ENABLED === "false") {
    return emptyResponse(trimmed, domain, false);
  }

  const enrichedQuery = buildDomainQuery(trimmed, domain);
  const results =
    provider === "tavily"
      ? await searchWithTavily(enrichedQuery, options)
      : await searchWithBrave(enrichedQuery, options);

  return {
    query: enrichedQuery,
    results,
    provider,
    domain,
    searchedAt: new Date().toISOString(),
    configured: true,
  };
}

export async function searchRegulationsOnline(
  input: RegulationSearchInput,
  maxResults = 3
): Promise<WebSearchResponse> {
  const parts = [input.codeRef, input.section, input.requirement?.slice(0, 60)]
    .filter(Boolean)
    .join(" ");

  return searchWeb(parts, {
    domain: "regulations",
    maxResults,
  });
}

export async function searchRenovationCasesOnline(
  input: CaseSearchInput,
  maxResults = 5
): Promise<WebSearchResponse> {
  const query = [
    input.location,
    input.buildingType,
    "建筑改造",
    input.targetFunction,
    input.strategyType,
  ]
    .filter(Boolean)
    .join(" ");

  return searchWeb(query, { domain: "cases", maxResults });
}

export async function searchMarketCostsOnline(
  input: CostSearchInput,
  maxResults = 4
): Promise<WebSearchResponse> {
  const query = [input.region, input.buildingType, "改造", input.strategyType, "单方造价"]
    .filter(Boolean)
    .join(" ");

  return searchWeb(query, { domain: "cost", maxResults });
}
