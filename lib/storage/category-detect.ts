import type { DocumentCategory } from "@/types";

const EXT_CATEGORY: Record<string, DocumentCategory> = {
  dwg: "old_drawings",
  dxf: "old_drawings",
  jpg: "survey_photos",
  jpeg: "survey_photos",
  png: "survey_photos",
  webp: "survey_photos",
  pdf: "reports",
  zip: "others",
};

export function inferDocumentCategory(
  filename: string,
  mimeType?: string
): DocumentCategory {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (EXT_CATEGORY[ext]) {
    if (ext === "pdf" && /plan|drawing|floor|立面|平面图|图纸/i.test(filename)) {
      return "old_drawings";
    }
    return EXT_CATEGORY[ext];
  }

  if (mimeType?.startsWith("image/")) return "survey_photos";
  if (mimeType === "application/pdf") return "reports";
  return "others";
}
