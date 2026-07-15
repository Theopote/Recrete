import { describe, it, expect } from "vitest";
import { inferDocumentCategory } from "@/lib/storage/category-detect";

describe("inferDocumentCategory", () => {
  it("detects survey photos from extension", () => {
    expect(inferDocumentCategory("site-photo.jpg", "image/jpeg")).toBe("survey_photos");
  });

  it("detects old drawings from dwg", () => {
    expect(inferDocumentCategory("floor-plan.dwg")).toBe("old_drawings");
  });

  it("detects drawing PDF from filename", () => {
    expect(inferDocumentCategory("A1-floor-plan.pdf", "application/pdf")).toBe(
      "old_drawings"
    );
  });

  it("defaults pdf to reports", () => {
    expect(inferDocumentCategory("structural-report.pdf", "application/pdf")).toBe(
      "reports"
    );
  });
});
