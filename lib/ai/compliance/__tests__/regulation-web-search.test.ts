import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  enrichComplianceEvidenceWithRegulations,
} from "@/lib/ai/compliance/regulation-context";
import { enrichComplianceEvidenceWithWebSearch } from "@/lib/ai/compliance/regulation-context.server";
import type { RegulationFactWithSource } from "@/lib/ai/compliance/regulation-context";

vi.mock("@/lib/ai/knowledge/web-search.server", () => ({
  isWebSearchConfigured: vi.fn(() => true),
  searchRegulationsOnline: vi.fn(async () => ({
    query: "GB 50016",
    results: [
      {
        title: "GB 50016 现行条文",
        url: "https://std.samr.gov.cn/gb50016",
        snippet: "应设置不少于2个安全出口",
      },
    ],
    provider: "tavily",
    domain: "regulations",
    searchedAt: new Date().toISOString(),
    configured: true,
  })),
  formatWebSearchSnippets: vi.fn(
    (results: Array<{ title: string; snippet: string; url: string }>) =>
      results.map((r) => `联网检索（需核实官方文本）: ${r.title}`).join(" · ")
  ),
}));

const check = {
  code: "GB 50016",
  section: "5.5.8",
  requirement: "Minimum two exits required",
  requirementZh: "应设置不少于2个安全出口",
  category: "fire" as const,
};

describe("regulation web enrichment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("keeps uploaded document evidence when facts exist", async () => {
    const facts: RegulationFactWithSource[] = [
      {
        id: "reg-1",
        codeRef: "GB 50016",
        section: "第5.5.8条",
        requirement: "应设置不少于2个安全出口",
        applicability: "Egress",
        priority: "high",
        documentId: "doc-1",
        documentName: "Fire Code.pdf",
      },
    ];

    const enriched = await enrichComplianceEvidenceWithWebSearch(
      "base evidence",
      check,
      facts
    );

    expect(enriched).toContain("Fire Code.pdf");
    expect(enriched).not.toContain("联网检索");
  });

  it("falls back to web search when no uploaded regulation facts match", async () => {
    const enriched = await enrichComplianceEvidenceWithWebSearch("base evidence", check, []);

    expect(enriched).toContain("联网检索");
    expect(enriched).toContain("GB 50016 现行条文");
  });

  it("supports explicit web result injection", () => {
    const enriched = enrichComplianceEvidenceWithRegulations("base", check, [], [
      {
        title: "Web hit",
        url: "https://example.com",
        snippet: "snippet",
      },
    ]);

    expect(enriched).toContain("联网检索");
  });
});
