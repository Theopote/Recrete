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
  tif: "scanned_archive",
  tiff: "scanned_archive",
};

const REGULATION_HINT =
  /规范|法规|标准|gb\s?\d|jgj|建标|防火|规划条件|code|regulation|standard|compliance/i;
const BRIEF_HINT =
  /任务书|brief|program|design\s?brief|任务要求|设计任务|委托书|scope\s?of\s?work/i;
const SCAN_HINT = /扫描|scan|archive|档案|ocr|tif/i;

export function inferDocumentCategory(
  filename: string,
  mimeType?: string
): DocumentCategory {
  const lowerName = filename.toLowerCase();
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";

  if (BRIEF_HINT.test(filename)) return "project_brief";
  if (REGULATION_HINT.test(filename)) return "regulations";
  if (SCAN_HINT.test(filename) || ext === "tif" || ext === "tiff") {
    return "scanned_archive";
  }

  if (EXT_CATEGORY[ext]) {
    if (ext === "pdf") {
      if (/plan|drawing|floor|立面|平面图|图纸/i.test(filename)) {
        return "old_drawings";
      }
      if (REGULATION_HINT.test(filename)) return "regulations";
      if (BRIEF_HINT.test(filename)) return "project_brief";
      if (SCAN_HINT.test(filename)) return "scanned_archive";
    }
    return EXT_CATEGORY[ext];
  }

  if (mimeType?.startsWith("image/")) {
    return SCAN_HINT.test(filename) ? "scanned_archive" : "survey_photos";
  }
  if (mimeType === "application/pdf") {
    if (REGULATION_HINT.test(filename)) return "regulations";
    if (BRIEF_HINT.test(filename)) return "project_brief";
    return "reports";
  }
  return "others";
}
