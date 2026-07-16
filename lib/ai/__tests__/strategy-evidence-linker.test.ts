import { describe, it, expect } from "vitest";
import { linkStrategyToSources } from "@/lib/ai/strategy-evidence-linker";
import type { DiagnosisItem, RenovationStrategy } from "@/types";
import type { SourceEvidence } from "@/types/ai";

const baseStrategy: Pick<RenovationStrategy, "id" | "type"> = {
  id: "strat-1",
  type: "deep_recreation",
};

const diagnosis: DiagnosisItem[] = [
  {
    id: "diag-1",
    projectId: "proj-1",
    title: "Load capacity verification",
    category: "structure",
    severity: "critical",
    status: "identified",
    description: "Needs check",
    requiresEngineerReview: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "diag-2",
    projectId: "proj-1",
    title: "Facade weathering",
    category: "facade",
    severity: "low",
    status: "identified",
    description: "Minor",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const evidence: SourceEvidence[] = [
  {
    id: "ev-1",
    projectId: "proj-1",
    sourceType: "document",
    documentId: "doc-1",
    confidence: 0.9,
    quote: "Beam capacity insufficient",
    createdAt: new Date(),
  },
  {
    id: "ev-2",
    projectId: "proj-1",
    sourceType: "photo",
    confidence: 0.7,
    quote: "Crack on column",
    createdAt: new Date(),
  },
];

describe("strategy evidence linker", () => {
  it("prioritizes high-severity structural diagnosis for deep recreation", () => {
    const links = linkStrategyToSources(baseStrategy, diagnosis, evidence);
    expect(links.diagnosisIds).toContain("diag-1");
    expect(links.diagnosisIds).not.toContain("diag-2");
  });

  it("includes top-confidence evidence", () => {
    const links = linkStrategyToSources(baseStrategy, diagnosis, evidence);
    expect(links.evidenceIds[0]).toBe("ev-1");
  });
});
