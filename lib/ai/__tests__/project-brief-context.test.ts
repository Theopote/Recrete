import { describe, it, expect } from "vitest";
import type { DocumentAsset } from "@/types";
import type { DocumentStructuredExtract } from "@/types/document-facts";
import { wrapExtractedText } from "@/lib/documents/structured-extract-storage";
import {
  collectStructuredProjectBriefFacts,
  formatProjectBriefConstraintsBlock,
} from "@/lib/ai/project-brief-context";

const briefExtract: DocumentStructuredExtract = {
  kind: "project_brief",
  summary: "Owner brief with objective, program, budget, and schedule.",
  facts: [
    {
      id: "brief-1",
      field: "objective",
      label: "Project objective",
      value: "Community cultural center with high public benefit",
    },
    {
      id: "brief-2",
      field: "constraint",
      label: "Design constraint",
      value: "Preserve existing main concrete frame",
    },
    {
      id: "brief-3",
      field: "schedule",
      label: "Schedule",
      value: "18 months",
    },
  ],
  modelName: "test",
  confidence: 0.8,
};

function makeDoc(overrides: Partial<DocumentAsset>): DocumentAsset {
  return {
    id: "doc-brief",
    projectId: "proj-1",
    name: "Design Brief.pdf",
    type: "pdf",
    fileUrl: "/uploads/brief.pdf",
    fileSize: 1000,
    mimeType: "application/pdf",
    category: "project_brief",
    extractedText: wrapExtractedText("brief", briefExtract),
    createdAt: new Date(),
    updatedAt: new Date(),
    isCurrentVersion: true,
    ...overrides,
  } as DocumentAsset;
}

describe("project brief context", () => {
  it("collects structured project brief facts", () => {
    const facts = collectStructuredProjectBriefFacts([makeDoc({})]);
    expect(facts).toHaveLength(3);
    expect(facts[0].documentName).toBe("Design Brief.pdf");
  });

  it("formats prioritized brief constraints block", () => {
    const facts = collectStructuredProjectBriefFacts([makeDoc({})]);
    const block = formatProjectBriefConstraintsBlock(facts);
    expect(block).toContain("Project objective");
    expect(block).toContain("Design constraint");
    expect(block).toContain("Schedule");
  });
});
