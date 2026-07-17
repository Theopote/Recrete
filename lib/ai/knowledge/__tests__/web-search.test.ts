import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("web-search", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    process.env = { ...originalEnv };
    delete process.env.TAVILY_API_KEY;
    delete process.env.BRAVE_SEARCH_API_KEY;
    delete process.env.WEB_SEARCH_ENABLED;
    delete process.env.WEB_SEARCH_PROVIDER;
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  it("reports unconfigured when no API keys are set", async () => {
    const { isWebSearchConfigured, searchWeb } = await import("../web-search.server");
    expect(isWebSearchConfigured()).toBe(false);

    const response = await searchWeb("GB 50016 防火规范", { domain: "regulations" });
    expect(response.configured).toBe(false);
    expect(response.results).toEqual([]);
  });

  it("searches regulations via Tavily when configured", async () => {
    process.env.TAVILY_API_KEY = "tvly-test";
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          results: [
            {
              title: "GB 50016-2014 建筑设计防火规范",
              url: "https://std.samr.gov.cn/example",
              content: "防火分区面积不应超过允许值",
              score: 0.91,
            },
          ],
        }),
        { status: 200 }
      )
    );

    const { searchRegulationsOnline } = await import("../web-search.server");
    const response = await searchRegulationsOnline({
      codeRef: "GB 50016",
      section: "5.3.2",
      requirement: "防火分区",
    });

    expect(response.provider).toBe("tavily");
    expect(response.results).toHaveLength(1);
    expect(response.results[0].title).toContain("GB 50016");
    expect(fetch).toHaveBeenCalledWith(
      "https://api.tavily.com/search",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("builds domain-specific renovation case queries", async () => {
    process.env.BRAVE_SEARCH_API_KEY = "brave-test";
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          web: {
            results: [
              {
                title: "上海工业厂房改造文创园案例",
                url: "https://example.com/case",
                description: "改造单方造价约 2800 元/㎡",
                profile: { name: "example.com" },
              },
            ],
          },
        }),
        { status: 200 }
      )
    );

    const { searchRenovationCasesOnline } = await import("../web-search.server");
    const response = await searchRenovationCasesOnline({
      location: "上海",
      buildingType: "Industrial",
      targetFunction: "文创",
      strategyType: "adaptive_reuse",
    });

    expect(response.provider).toBe("brave");
    expect(response.query).toContain("建筑改造");
    expect(response.results[0].snippet).toContain("2800");
  });
});
