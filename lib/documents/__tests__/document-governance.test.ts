import { describe, it, expect } from "vitest";
import { inferDocumentCategory } from "@/lib/storage/category-detect";
import { parseTagsInput, serializeTagsForStorage, parseTagsFromStorage } from "@/lib/documents/tags";
import { normalizeDocumentAsset, nextDocumentVersionNumber } from "@/lib/documents/governance";
import type { DocumentAsset } from "@/types";

describe("inferDocumentCategory", () => {
  it("detects regulations from filename", () => {
    expect(inferDocumentCategory("GB50016-2014-fire-code.pdf", "application/pdf")).toBe(
      "regulations"
    );
  });

  it("detects project brief from filename", () => {
    expect(inferDocumentCategory("设计任务书-v2.pdf", "application/pdf")).toBe("project_brief");
  });

  it("detects scanned archive from tiff", () => {
    expect(inferDocumentCategory("archive-scan-1986.tiff")).toBe("scanned_archive");
  });

  it("detects survey photos from extension", () => {
    expect(inferDocumentCategory("site-photo.jpg", "image/jpeg")).toBe("survey_photos");
  });
});

describe("document tags", () => {
  it("parses comma-separated tags", () => {
    expect(parseTagsInput("fire, structure, 1986")).toEqual(["fire", "structure", "1986"]);
  });

  it("round-trips through storage serialization", () => {
    const stored = serializeTagsForStorage(["fire", "heritage"]);
    expect(parseTagsFromStorage(stored)).toEqual(["fire", "heritage"]);
  });
});

describe("document governance", () => {
  it("normalizes legacy documents with defaults", () => {
    const legacy = {
      id: "doc-x",
      projectId: "p1",
      name: "test.pdf",
      type: "pdf",
      fileUrl: "/uploads/p1/test.pdf",
      fileSize: 100,
      mimeType: "application/pdf",
      category: "reports",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as DocumentAsset;

    const normalized = normalizeDocumentAsset(legacy);
    expect(normalized.versionGroupId).toBe("doc-x");
    expect(normalized.versionNumber).toBe(1);
    expect(normalized.isCurrentVersion).toBe(true);
    expect(normalized.projectPhase).toBe("general");
  });

  it("computes next version number", () => {
    const versions = [
      normalizeDocumentAsset({
        id: "a",
        projectId: "p",
        name: "a",
        type: "pdf",
        fileUrl: "/a",
        fileSize: 1,
        mimeType: "application/pdf",
        category: "reports",
        versionGroupId: "g1",
        versionNumber: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      normalizeDocumentAsset({
        id: "b",
        projectId: "p",
        name: "b",
        type: "pdf",
        fileUrl: "/b",
        fileSize: 1,
        mimeType: "application/pdf",
        category: "reports",
        versionGroupId: "g1",
        versionNumber: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ];
    expect(nextDocumentVersionNumber(versions)).toBe(4);
  });
});
