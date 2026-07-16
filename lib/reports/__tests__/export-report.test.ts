import { describe, it, expect } from "vitest";
import { Table } from "docx";
import { markdownToDocxBlocks, parseInlineTextRuns } from "@/lib/reports/export-docx";
import { sanitizeReportFilename } from "@/lib/reports/report-filename";
import { markdownToHtml } from "@/lib/reports/export-pdf";

describe("report export helpers", () => {
  it("sanitizes filenames with unicode preserved in slug", () => {
    expect(sanitizeReportFilename("Existing Condition Report")).toBe("existing-condition-report");
    expect(sanitizeReportFilename("现状调研报告 2026")).toBe("现状调研报告-2026");
  });

  it("parses inline markdown styles into text runs", () => {
    const runs = parseInlineTextRuns("**Bold** and *italic*");
    expect(runs.length).toBeGreaterThanOrEqual(2);
  });

  it("converts markdown headings and lists to docx blocks", () => {
    const blocks = markdownToDocxBlocks("## Summary\n\n- Item one\n- Item two");
    expect(blocks.length).toBeGreaterThanOrEqual(3);
  });

  it("converts markdown tables for html and docx", () => {
    const markdown = "| A | B |\n| --- | --- |\n| 1 | 2 |";
    expect(markdownToHtml(markdown)).toContain("<table>");
    expect(markdownToDocxBlocks(markdown).some((block) => block instanceof Table)).toBe(true);
  });
});
