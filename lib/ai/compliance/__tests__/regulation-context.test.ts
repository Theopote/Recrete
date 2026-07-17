import { describe, it, expect } from "vitest";
import {
  collectStructuredRegulationFacts,
  enrichComplianceEvidenceWithRegulations,
  findRegulationFactsForCheck,
  formatStructuredRegulationsBlock,
} from "@/lib/ai/compliance/regulation-context";
import { wrapExtractedText } from "@/lib/documents/structured-extract-storage";
import type { DocumentAsset } from "@/types";
import type { DocumentStructuredExtract } from "@/types/document-facts";

const regulationExtract: DocumentStructuredExtract = {
  kind: "regulations",
  summary: "Fire code clauses for occupancy change.",
  facts: [
    {
      id: "reg-1",
      codeRef: "GB 50016",
      section: "第5.3.2条",
      requirement: "防火分区面积不应超过允许的最大值，疏散距离应满足本章规定",
      applicability: "Public assembly conversion",
      priority: "critical",
      remediationHint: "Verify compartment sizes with fire engineer.",
    },
    {
      id: "reg-2",
      codeRef: "GB 50016",
      section: "第5.5.8条",
      requirement: "应设置不少于2个安全出口",
      applicability: "Egress capacity",
      priority: "high",
    },
  ],
  modelName: "test",
  confidence: 0.8,
};

const doc = (overrides: Partial<DocumentAsset>): DocumentAsset =>
  ({
    id: "doc-reg",
    projectId: "proj-1",
    name: "GB50016-fire-code.pdf",
    type: "pdf",
    fileUrl: "/uploads/reg.pdf",
    fileSize: 1000,
    mimeType: "application/pdf",
    category: "regulations",
    extractedText: wrapExtractedText("GB 50016 fire clauses", regulationExtract),
    createdAt: new Date(),
    updatedAt: new Date(),
    isCurrentVersion: true,
    ...overrides,
  }) as DocumentAsset;

describe("regulation context for compliance", () => {
  it("collects structured facts from regulation documents", () => {
    const facts = collectStructuredRegulationFacts([doc({})]);
    expect(facts).toHaveLength(2);
    expect(facts[0].documentName).toBe("GB50016-fire-code.pdf");
  });

  it("matches fire checks to relevant regulation facts", () => {
    const facts = collectStructuredRegulationFacts([doc({})]);
    const matched = findRegulationFactsForCheck(
      {
        code: "GB 50016",
        section: "5.5.8",
        requirement: "Minimum two exits required for occupancy",
        requirementZh: "应设置不少于2个安全出口",
        category: "fire",
      },
      facts
    );
    expect(matched.length).toBeGreaterThan(0);
    expect(matched[0].requirement).toMatch(/安全出口/);
  });

  it("enriches compliance evidence with document tags", () => {
    const facts = collectStructuredRegulationFacts([doc({})]);
    const enriched = enrichComplianceEvidenceWithRegulations(
      "GB 50016 §5.5.8 — required: 2 exits",
      {
        code: "GB 50016",
        section: "5.5.8",
        requirement: "Two exits required",
        category: "fire",
      },
      facts
    );
    expect(enriched).toContain("[doc:GB50016-fire-code.pdf]");
    expect(enriched).toContain("GB 50016");
  });

  it("formats prompt block for compliance chain", () => {
    const facts = collectStructuredRegulationFacts([doc({})]);
    const block = formatStructuredRegulationsBlock(facts);
    expect(block).toContain("Structured Regulation Extracts");
    expect(block).toContain("GB50016-fire-code.pdf");
  });
});
