import { describe, it, expect } from "vitest";
import {
  parseEvidenceTags,
  stripEvidenceTags,
  resolveEvidenceForDiagnosis,
} from "@/lib/documents/evidence-tags";
import type { DiagnosisItem } from "@/types";
import type { SourceEvidence } from "@/types/ai";

describe("evidence tags", () => {
  it("parses and strips evidence tags", () => {
    const text = "Beam spalling observed [doc:Survey.pdf] [evidence:ev-42]";
    expect(parseEvidenceTags(text)).toEqual(["ev-42"]);
    expect(stripEvidenceTags(text)).toBe("Beam spalling observed");
  });

  it("resolves evidence by linked ids and tags", () => {
    const evidence: SourceEvidence[] = [
      {
        id: "ev-42",
        projectId: "p1",
        sourceType: "document",
        confidence: 0.9,
        quote: "Beam spalling",
        createdAt: new Date(),
      },
    ];
    const item = {
      evidence: "Finding [evidence:ev-42]",
      linkedEvidenceIds: ["ev-42"],
    } as Pick<DiagnosisItem, "evidence" | "linkedEvidenceIds">;

    expect(resolveEvidenceForDiagnosis(item, evidence)).toHaveLength(1);
  });
});
