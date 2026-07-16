import type { BoundingBox, DrawingAnalysisResult } from "@/lib/ai/vision/types";

export type DrawingDisciplineFilter =
  | "all"
  | DrawingAnalysisResult["drawingType"];

export const DRAWING_DISCIPLINE_TABS: {
  id: DrawingDisciplineFilter;
  labelEn: string;
  labelZh: string;
}[] = [
  { id: "all", labelEn: "All", labelZh: "全部" },
  { id: "floor_plan", labelEn: "Floor Plans", labelZh: "平面" },
  { id: "elevation", labelEn: "Elevations", labelZh: "立面" },
  { id: "section", labelEn: "Sections", labelZh: "剖面" },
  { id: "structural", labelEn: "Structure", labelZh: "结构" },
  { id: "mep", labelEn: "MEP", labelZh: "设备" },
];

export const DRAWING_TYPE_LABELS: Record<
  DrawingAnalysisResult["drawingType"],
  { en: string; zh: string }
> = {
  floor_plan: { en: "Floor Plan", zh: "平面图" },
  elevation: { en: "Elevation", zh: "立面图" },
  section: { en: "Section", zh: "剖面图" },
  detail: { en: "Detail", zh: "详图" },
  structural: { en: "Structural", zh: "结构图" },
  mep: { en: "MEP", zh: "机电图" },
  unknown: { en: "Drawing", zh: "图纸" },
};

export function collectBoundingBoxes(result: DrawingAnalysisResult): BoundingBox[] {
  const boxes: BoundingBox[] = [];
  for (const room of result.rooms) boxes.push(room.location);
  for (const dim of result.dimensions) boxes.push(dim.location);
  for (const note of result.annotations) boxes.push(note.location);
  for (const el of result.structuralElements) boxes.push(el.location);
  return boxes;
}

export function normalizeBoundingBox(
  box: BoundingBox,
  bounds: { minX: number; minY: number; width: number; height: number }
) {
  const pad = 0.02;
  const x = ((box.x - bounds.minX) / bounds.width) * (1 - pad * 2) + pad;
  const y = ((box.y - bounds.minY) / bounds.height) * (1 - pad * 2) + pad;
  const w = (box.width / bounds.width) * (1 - pad * 2);
  const h = (box.height / bounds.height) * (1 - pad * 2);
  return {
    x: x * 100,
    y: y * 100,
    width: Math.max(w * 100, 0.5),
    height: Math.max(h * 100, 0.5),
  };
}

export function computeDrawingBounds(result: DrawingAnalysisResult) {
  const boxes = collectBoundingBoxes(result);
  if (boxes.length === 0) {
    return { minX: 0, minY: 0, width: 500, height: 400 };
  }
  const minX = Math.min(...boxes.map((b) => b.x));
  const minY = Math.min(...boxes.map((b) => b.y));
  const maxX = Math.max(...boxes.map((b) => b.x + b.width));
  const maxY = Math.max(...boxes.map((b) => b.y + b.height));
  return {
    minX,
    minY,
    width: Math.max(maxX - minX, 1),
    height: Math.max(maxY - minY, 1),
  };
}

export type OverlayLayer = "rooms" | "structure" | "annotations" | "dimensions";

export const OVERLAY_LAYER_COLORS: Record<OverlayLayer, string> = {
  rooms: "rgba(34, 197, 94, 0.35)",
  structure: "rgba(59, 130, 246, 0.45)",
  annotations: "rgba(234, 179, 8, 0.4)",
  dimensions: "rgba(168, 85, 247, 0.35)",
};

export const OVERLAY_LAYER_STROKES: Record<OverlayLayer, string> = {
  rooms: "rgb(34, 197, 94)",
  structure: "rgb(59, 130, 246)",
  annotations: "rgb(234, 179, 8)",
  dimensions: "rgb(168, 85, 247)",
};
