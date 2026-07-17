import { describe, it, expect } from "vitest";
import type { DocumentAsset } from "@/types";
import {
  wrapExtractedText,
  parseStoredDocumentExtract,
  structuredSummaryForDisplay,
  memoryFactsFromStructuredExtract,
} from "@/lib/documents/structured-extract-storage";
import {
  extractRegulationFactsRuleBased,
  extractProjectBriefFactsRuleBased,
  buildStructuredFactEvidence,
} from "@/lib/ai/document-structured-extract";

const baseDoc = (overrides: Partial<DocumentAsset>): DocumentAsset =>
  ({
    id: "doc-test",
    projectId: "proj-1",
    name: "test.pdf",
    type: "pdf",
    fileUrl: "/uploads/test.pdf",
    fileSize: 1000,
    mimeType: "application/pdf",
    category: "regulations",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as DocumentAsset;

describe("structured extract storage", () => {
  it("round-trips structured extract in extractedText JSON", () => {
    const structured = extractRegulationFactsRuleBased(
      "GB 50016 第5.3.2条 应设置不少于2个安全出口。防火分区面积不应超过规定值。",
      baseDoc({ name: "GB50016-fire.pdf", category: "regulations" })
    );

    const stored = wrapExtractedText("raw preview text", structured);
    const parsed = parseStoredDocumentExtract(stored);

    expect(parsed?.version).toBe(1);
    expect(parsed?.rawTextPreview).toBe("raw preview text");
    expect(parsed?.structured?.kind).toBe("regulations");
    expect(parsed?.structured?.facts.length).toBeGreaterThan(0);
  });

  it("falls back to plain text when JSON is invalid", () => {
    const parsed = parseStoredDocumentExtract("plain OCR text without JSON");
    expect(parsed?.rawTextPreview).toBe("plain OCR text without JSON");
    expect(parsed?.structured).toBeUndefined();
  });

  it("builds memory facts from regulation extract", () => {
    const extract = extractRegulationFactsRuleBased(
      "应设置不少于2个安全出口",
      baseDoc({ name: "GB50016.pdf" })
    );
    const merged = memoryFactsFromStructuredExtract(extract, "GB50016.pdf");
    expect(merged.designConstraints.length).toBeGreaterThan(0);
    expect(merged.knownFacts.some((f) => f.includes("Regulation extract"))).toBe(true);
  });

  it("formats structured summary for display", () => {
    const extract = extractProjectBriefFactsRuleBased(
      "建设目标: 社区文化服务\n功能定位: 展厅与报告厅\n总建筑面积: 3200㎡",
      baseDoc({ category: "project_brief", name: "设计任务书.pdf" })
    );
    const summary = structuredSummaryForDisplay(extract);
    expect(summary).toContain("Project objective");
    expect(summary).toContain("3200");
  });
});

describe("rule-based structured extract", () => {
  it("extracts regulation clauses with GB code reference", () => {
    const extract = extractRegulationFactsRuleBased(
      "GB 50016-2014 第5.5.8条 应设置不少于2个安全出口。不应采用侧拉门作为疏散门。不得减少原有疏散宽度。",
      baseDoc({ name: "GB50016-fire-code.pdf" }),
      { targetFunction: "community cultural center" }
    );

    expect(extract.kind).toBe("regulations");
    expect(extract.facts.length).toBeGreaterThanOrEqual(2);
    expect(extract.facts[0].codeRef).toMatch(/GB/i);
    expect(extract.facts.some((f) => f.priority === "high" || f.priority === "critical")).toBe(
      true
    );
  });

  it("extracts project brief fields from Chinese labels", () => {
    const extract = extractProjectBriefFactsRuleBased(
      "建设目标: 服务社区公众\n功能定位: 多功能展厅\n总建筑面积: 3200㎡\n工期: 18个月",
      baseDoc({ category: "project_brief", name: "设计任务书.pdf" }),
      { renovationGoal: "Adaptive reuse to cultural center" }
    );

    expect(extract.kind).toBe("project_brief");
    expect(extract.facts.some((f) => f.field === "program")).toBe(true);
    expect(extract.facts.some((f) => f.field === "metric")).toBe(true);
    expect(extract.facts.some((f) => f.label.includes("Renovation goal"))).toBe(true);
  });

  it("creates source evidence rows from structured facts", () => {
    const extract = extractRegulationFactsRuleBased(
      "应设置不少于2个安全出口",
      baseDoc({ name: "GB50016.pdf" })
    );
    const evidence = buildStructuredFactEvidence("proj-1", "doc-1", extract);
    expect(evidence.length).toBeGreaterThan(0);
    expect(evidence[0].sourceType).toBe("document");
    expect(evidence[0].documentId).toBe("doc-1");
  });
});
