import { describe, it, expect } from "vitest";
import {
  buildRenovationContext,
  formatDocumentAnalysisSection,
  formatEvidenceSection,
  formatRenovationContextBlock,
} from "@/lib/ai/renovation-context";
import type { ProjectWithRelations } from "@/types";

function minimalProject(overrides?: Partial<ProjectWithRelations>): ProjectWithRelations {
  return {
    id: "proj-1",
    organizationId: "org-1",
    name: "Test Building",
    code: "TB-001",
    location: "Xi'an",
    buildingType: "office",
    originalFunction: "Government office",
    currentFunction: "Vacant office",
    targetFunction: "Community center",
    constructionYear: 1986,
    structureType: "concrete frame",
    floorCount: 6,
    grossFloorArea: 4200,
    status: "survey",
    renovationGoal: "Adaptive reuse with limited budget",
    budgetLevel: "low",
    riskLevel: "medium",
    healthScore: 55,
    potentialScore: 72,
    aiReadinessScore: 40,
    dataCompletenessScore: 35,
    description: "",
    createdAt: new Date(),
    updatedAt: new Date(),
    building: null,
    documents: [
      {
        id: "doc-1",
        projectId: "proj-1",
        name: "South Elevation.pdf",
        type: "drawing",
        category: "old_drawings",
        fileUrl: "/uploads/a.pdf",
        mimeType: "application/pdf",
        fileSize: 1000,
        aiSummary: "1986 south elevation shows original window rhythm and concrete spandrel panels.",
        extractedText: null,
        description: null,
        uploadedById: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    diagnosis: [],
    strategies: [],
    issues: [],
    reports: [],
    ...overrides,
  };
}

describe("renovation context", () => {
  it("includes analyzed document summaries in prompt block", () => {
    const block = formatDocumentAnalysisSection(minimalProject());
    expect(block).toContain("South Elevation.pdf");
    expect(block).toContain("concrete spandrel");
  });

  it("includes evidence quotes when present", () => {
    const block = formatEvidenceSection([
      {
        id: "ev-1",
        projectId: "proj-1",
        sourceType: "document",
        sourceId: "doc-1",
        quote: "Stair width 1.1m insufficient for current code",
        locationLabel: "Level 2",
        confidence: 0.9,
        createdAt: new Date(),
      },
    ]);
    expect(block).toContain("Stair width");
    expect(block).toContain("Level 2");
  });

  it("combines documents and evidence for strategy/diagnosis prompts", () => {
    const project = minimalProject();
    const ctx = buildRenovationContext(project, [
      {
        id: "ev-1",
        projectId: "proj-1",
        sourceType: "photo",
        sourceId: "photo-1",
        quote: "Facade spalling at grid B-3",
        confidence: 0.85,
        createdAt: new Date(),
      },
    ]);
    const block = formatRenovationContextBlock(ctx);
    expect(block).toContain("South Elevation.pdf");
    expect(block).toContain("Facade spalling");
  });
});
