import { describe, it, expect, beforeEach } from "vitest";
import { resetStore } from "@/lib/db/repository";
import { addSourceEvidence, addDiagnosisItems, getProjectById } from "@/lib/db/repository";
import { runDiagnosisEvidenceRelinkWorkflow } from "@/lib/ai/workflow/diagnosis-workflow";
import type { DiagnosisItem } from "@/types";

describe("diagnosis evidence relink workflow", () => {
  beforeEach(() => {
    process.env.USE_DATABASE = "false";
    resetStore();
  });

  it("links existing diagnosis items to document evidence", async () => {
    const project = await getProjectById("proj-demo", "org-1");
    expect(project).toBeTruthy();

    await addSourceEvidence({
      projectId: "proj-demo",
      sourceType: "document",
      sourceId: "doc-6",
      documentId: "doc-6",
      locationLabel: "GB 50016 §5.3.2",
      quote: "Fire compartment area shall not exceed allowable limits for public assembly",
      confidence: 0.9,
    });

    const items = await addDiagnosisItems("proj-demo", [
      {
        title: "Fire compartment non-compliance risk",
        category: "fire_safety",
        severity: "high",
        status: "identified",
        description: "Occupancy change may require fire compartment upgrades",
        evidence: "Review applicable fire code sections",
        recommendation: "Engage fire engineer",
        relatedLocation: null,
        requiresEngineerReview: true,
      } as Omit<DiagnosisItem, "id" | "projectId" | "createdAt" | "updatedAt">,
    ]);

    const result = await runDiagnosisEvidenceRelinkWorkflow("proj-demo", "org-1");
    expect(result).toBeTruthy();
    expect(result!.updatedCount).toBeGreaterThanOrEqual(1);

    const relinked = result!.diagnosisItems.find((d) => d.id === items[0].id);
    expect(relinked?.linkedEvidenceIds?.length).toBeGreaterThan(0);
    expect(relinked?.evidence).toContain("[evidence:");
  });
});
