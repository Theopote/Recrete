import { describe, it, expect } from "vitest";
import { computeDataCompletenessScore } from "@/lib/documents/sync-project-completeness";
import type { DocumentAsset } from "@/types";

const doc = (overrides: Partial<DocumentAsset>): DocumentAsset =>
  ({
    id: "doc-1",
    projectId: "proj-1",
    name: "test.pdf",
    type: "pdf",
    fileUrl: "/uploads/test.pdf",
    fileSize: 1000,
    mimeType: "application/pdf",
    category: "reports",
    createdAt: new Date(),
    updatedAt: new Date(),
    isCurrentVersion: true,
    ...overrides,
  }) as DocumentAsset;

describe("sync project completeness", () => {
  it("derives score from phase completeness report", () => {
    const documents = [
      doc({ id: "d1", category: "old_drawings", aiSummary: "Drawing" }),
      doc({ id: "d2", category: "survey_photos", aiSummary: "Photo" }),
      doc({ id: "d3", category: "regulations", aiSummary: "Code" }),
      doc({ id: "d4", category: "project_brief", aiSummary: "Brief" }),
    ];

    const score = computeDataCompletenessScore(documents, "survey");
    expect(score).toBeGreaterThanOrEqual(70);
    expect(score).toBeLessThanOrEqual(100);
  });
});
