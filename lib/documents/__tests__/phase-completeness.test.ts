import { describe, it, expect } from "vitest";
import {
  computePhaseCompleteness,
  computeProjectPhaseCompleteness,
} from "@/lib/documents/phase-completeness";
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

describe("phase completeness", () => {
  it("scores survey phase from document categories", () => {
    const documents = [
      doc({ id: "d1", category: "old_drawings", aiSummary: "Drawing summary" }),
      doc({ id: "d2", category: "survey_photos" }),
      doc({ id: "d3", category: "regulations", aiSummary: "Code excerpt" }),
    ];

    const result = computePhaseCompleteness("survey", documents);
    expect(result.score).toBeGreaterThanOrEqual(50);
    expect(result.slots.find((s) => s.id === "drawings")?.satisfied).toBe(true);
    expect(result.slots.find((s) => s.id === "brief-reg")?.satisfied).toBe(true);
  });

  it("reports missing slots", () => {
    const result = computePhaseCompleteness("diagnosis", [doc({ category: "regulations" })]);
    expect(result.missingLabels.length).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(100);
  });

  it("computes project report with active phase from status", () => {
    const report = computeProjectPhaseCompleteness(
      [doc({ category: "project_brief", aiSummary: "Brief" })],
      "survey"
    );
    expect(report.activePhase).toBe("survey");
    expect(report.overallScore).toBeGreaterThan(0);
    expect(report.phases.length).toBeGreaterThan(0);
  });
});
