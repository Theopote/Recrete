import { describe, it, expect } from "vitest";
import {
  linkDiagnosisToEvidence,
  enrichDiagnosisEvidenceText,
} from "@/lib/ai/diagnosis-evidence-linker";
import type { DiagnosisItem, DocumentAsset } from "@/types";
import type { SourceEvidence } from "@/types/ai";

const diagnosis: Pick<DiagnosisItem, "title" | "description" | "evidence" | "category"> = {
  title: "Structural beam capacity insufficient",
  category: "structure",
  description: "Existing beams may not support increased live load",
  evidence: "Review as-built structural drawings",
};

const evidence: SourceEvidence[] = [
  {
    id: "ev-1",
    projectId: "proj-1",
    sourceType: "document",
    documentId: "doc-1",
    confidence: 0.92,
    quote: "Beam capacity insufficient for proposed occupancy load",
    locationLabel: "Structural report p.12",
    createdAt: new Date(),
  },
  {
    id: "ev-2",
    projectId: "proj-1",
    sourceType: "photo",
    confidence: 0.7,
    quote: "Minor facade weathering",
    createdAt: new Date(),
  },
];

const documents: DocumentAsset[] = [
  {
    id: "doc-1",
    projectId: "proj-1",
    name: "Structural Assessment.pdf",
    type: "pdf",
    fileUrl: "/uploads/doc-1.pdf",
    fileSize: 1000,
    mimeType: "application/pdf",
    category: "structure_documents",
    createdAt: new Date(),
    updatedAt: new Date(),
  } as DocumentAsset,
];

describe("diagnosis evidence linker", () => {
  it("links structural diagnosis to matching document evidence", () => {
    const links = linkDiagnosisToEvidence(diagnosis, evidence, documents);
    expect(links.evidenceIds).toContain("ev-1");
    expect(links.evidenceIds).not.toContain("ev-2");
  });

  it("embeds evidence tags in enriched evidence text", () => {
    const links = linkDiagnosisToEvidence(diagnosis, evidence, documents);
    const enriched = enrichDiagnosisEvidenceText(
      diagnosis,
      links,
      evidence,
      { "doc-1": "Structural Assessment.pdf" }
    );
    expect(enriched.evidence).toContain("[evidence:ev-1]");
    expect(enriched.evidence).toContain("[doc:Structural Assessment.pdf]");
    expect(enriched.linkedEvidenceIds).toContain("ev-1");
  });
});
