import type { ComplianceMeasurements } from "@/lib/ai/compliance/types";
import type { ComplianceMeasurementKey } from "@/lib/ai/compliance/measurements";
import { mergeMeasurements, stripEmptyMeasurements } from "@/lib/ai/compliance/measurements";
import type { DrawingAnalysisResult } from "@/lib/ai/vision/types";
import type {
  DrawingMeasurementExtraction,
  DrawingMeasurementProvenance,
} from "@/types/drawing-measurements";

export interface DrawingMeasurementSource {
  drawingId?: string;
  drawingType: DrawingAnalysisResult["drawingType"];
  label: string;
  confidence?: number;
  analysis: DrawingAnalysisResult;
}

interface MeasurementCandidate {
  field: ComplianceMeasurementKey;
  value: number | boolean;
  confidence: number;
  source: string;
  method: string;
}

const STAIR_LABEL = /楼梯|stair|疏散梯/i;
const ACCESSIBLE_TEXT = /无障碍|accessible|坡道|ramp|wheelchair/i;
const SPRINKLER_TEXT = /喷淋|sprinkler|自动喷水/i;
const ENTRANCE_TEXT = /主入口|main\s*entr|无障碍入口|accessible\s*entr/i;
const FIRE_ZONE_AREA_TEXT = /防火分区(?:面积)?\s*(\d+(?:\.\d+)?)\s*(?:m²|m2|㎡)?/i;
const COVER_TEXT = /保护层\s*(\d+(?:\.\d+)?)\s*mm/i;
const LOAD_TEXT = /活荷载\s*(\d+(?:\.\d+)?)\s*kN/i;
const TRAVEL_TEXT = /疏散.{0,12}?(?:距离|distance).{0,8}?(\d+(?:\.\d+)?)\s*m/i;
const STAIR_WIDTH_TEXT = /(?:楼梯|stair).{0,16}?(?:净宽|width).{0,8}?(\d+(?:\.\d+)?)\s*m/i;
const CEILING_TEXT = /(?:净高|clear\s*height|ceiling\s*height)\s*[:：]?\s*(\d+(?:\.\d+)?)\s*m/i;
const WINDOW_U_TEXT = /(?:传热系数|u[\s-]?value)\s*[:=]?\s*(\d+(?:\.\d+)?)/i;

function inRange(value: number, min: number, max: number) {
  return value >= min && value <= max;
}

function normalizeLength(value: number, unit: string): number {
  const u = unit.toLowerCase();
  if (u === "mm") return value / 1000;
  if (u === "cm") return value / 100;
  return value;
}

function collectTexts(analysis: DrawingAnalysisResult): string[] {
  return [
    analysis.summary,
    ...analysis.extractedText,
    ...analysis.annotations.map((item) => item.text),
    ...analysis.rooms.map((room) => room.label),
    ...analysis.structuralElements
      .map((element) => [element.size, element.material, element.id].filter(Boolean).join(" "))
      .filter(Boolean),
  ];
}

function firstRegexNumber(texts: string[], pattern: RegExp): number | undefined {
  for (const text of texts) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const value = Number(match[1]);
      if (Number.isFinite(value)) return value;
    }
  }
  return undefined;
}

function pushCandidate(
  candidates: MeasurementCandidate[],
  candidate: MeasurementCandidate
) {
  candidates.push(candidate);
}

function extractFromTexts(
  source: DrawingMeasurementSource,
  candidates: MeasurementCandidate[]
) {
  const texts = collectTexts(source.analysis);
  const baseConfidence = Math.min(0.95, Math.max(0.45, source.confidence ?? source.analysis.confidence));

  const ceilingFromText = firstRegexNumber(texts, CEILING_TEXT);
  if (ceilingFromText != null && inRange(ceilingFromText, 2.4, 5.0)) {
    pushCandidate(candidates, {
      field: "ceilingHeight",
      value: ceilingFromText,
      confidence: baseConfidence,
      source: source.label,
      method: "annotation_regex_ceiling",
    });
  }

  const stairFromText = firstRegexNumber(texts, STAIR_WIDTH_TEXT);
  if (stairFromText != null && inRange(stairFromText, 0.9, 2.5)) {
    pushCandidate(candidates, {
      field: "stairWidth",
      value: stairFromText,
      confidence: baseConfidence,
      source: source.label,
      method: "annotation_regex_stair",
    });
  }

  const travelFromText = firstRegexNumber(texts, TRAVEL_TEXT);
  if (travelFromText != null && inRange(travelFromText, 5, 60)) {
    pushCandidate(candidates, {
      field: "travelDistance",
      value: travelFromText,
      confidence: baseConfidence * 0.9,
      source: source.label,
      method: "annotation_regex_travel",
    });
  }

  const loadFromText = firstRegexNumber(texts, LOAD_TEXT);
  if (loadFromText != null && inRange(loadFromText, 1, 10)) {
    pushCandidate(candidates, {
      field: "existingLoadKN",
      value: loadFromText,
      confidence: baseConfidence,
      source: source.label,
      method: "annotation_regex_load",
    });
  }

  const coverFromText = firstRegexNumber(texts, COVER_TEXT);
  if (coverFromText != null && inRange(coverFromText, 10, 80)) {
    pushCandidate(candidates, {
      field: "coverThickness",
      value: coverFromText,
      confidence: baseConfidence,
      source: source.label,
      method: "annotation_regex_cover",
    });
  }

  const fireZoneFromText = firstRegexNumber(texts, FIRE_ZONE_AREA_TEXT);
  if (fireZoneFromText != null && inRange(fireZoneFromText, 100, 10000)) {
    pushCandidate(candidates, {
      field: "fireCompartmentArea",
      value: fireZoneFromText,
      confidence: baseConfidence * 0.85,
      source: source.label,
      method: "annotation_regex_fire_zone",
    });
  }

  const windowUFromText = firstRegexNumber(texts, WINDOW_U_TEXT);
  if (windowUFromText != null && inRange(windowUFromText, 0.5, 6)) {
    pushCandidate(candidates, {
      field: "windowUValue",
      value: windowUFromText,
      confidence: baseConfidence * 0.8,
      source: source.label,
      method: "annotation_regex_window_u",
    });
  }

  if (texts.some((text) => ACCESSIBLE_TEXT.test(text) || ENTRANCE_TEXT.test(text))) {
    pushCandidate(candidates, {
      field: "hasAccessibleEntrance",
      value: true,
      confidence: baseConfidence * 0.75,
      source: source.label,
      method: "annotation_keyword_accessible",
    });
  }

  if (texts.some((text) => SPRINKLER_TEXT.test(text))) {
    pushCandidate(candidates, {
      field: "hasSprinkler",
      value: true,
      confidence: baseConfidence * 0.8,
      source: source.label,
      method: "annotation_keyword_sprinkler",
    });
  }
}

function extractFromRooms(
  source: DrawingMeasurementSource,
  candidates: MeasurementCandidate[]
) {
  const baseConfidence = Math.min(0.9, Math.max(0.5, source.confidence ?? source.analysis.confidence));

  if (source.drawingType === "floor_plan") {
    const compartmentArea = source.analysis.rooms
      .filter((room) => room.area != null && room.area > 0)
      .reduce((sum, room) => sum + (room.area ?? 0), 0);

    if (compartmentArea >= 100 && compartmentArea <= 10000) {
      pushCandidate(candidates, {
        field: "fireCompartmentArea",
        value: Math.round(compartmentArea * 10) / 10,
        confidence: baseConfidence * 0.7,
        source: source.label,
        method: "room_area_sum",
      });
    }
  }

  for (const room of source.analysis.rooms) {
    if (!STAIR_LABEL.test(room.label)) continue;
    const width = room.dimensions?.width;
    if (width != null && inRange(width, 0.9, 2.5)) {
      pushCandidate(candidates, {
        field: "stairWidth",
        value: width,
        confidence: baseConfidence * 0.85,
        source: source.label,
        method: "stair_room_width",
      });
    }
  }
}

function extractFromDimensions(
  source: DrawingMeasurementSource,
  candidates: MeasurementCandidate[]
) {
  const baseConfidence = Math.min(0.88, Math.max(0.45, source.confidence ?? source.analysis.confidence));

  for (const dimension of source.analysis.dimensions) {
    const meters = normalizeLength(dimension.value, dimension.unit);

    if (
      dimension.type === "height" &&
      (source.drawingType === "section" || source.drawingType === "detail") &&
      inRange(meters, 2.4, 5.0)
    ) {
      pushCandidate(candidates, {
        field: "ceilingHeight",
        value: meters,
        confidence: baseConfidence * 0.8,
        source: source.label,
        method: "dimension_height_section",
      });
    }

    if (
      dimension.type === "length" &&
      source.drawingType === "floor_plan" &&
      inRange(meters, 0.9, 2.5)
    ) {
      pushCandidate(candidates, {
        field: "stairWidth",
        value: meters,
        confidence: baseConfidence * 0.55,
        source: source.label,
        method: "dimension_length_floor_plan",
      });
    }

    if (
      dimension.type === "area" &&
      source.drawingType === "floor_plan" &&
      inRange(dimension.value, 100, 10000)
    ) {
      pushCandidate(candidates, {
        field: "fireCompartmentArea",
        value: dimension.value,
        confidence: baseConfidence * 0.75,
        source: source.label,
        method: "dimension_area_floor_plan",
      });
    }

    if (
      dimension.type === "length" &&
      source.drawingType === "floor_plan" &&
      inRange(meters, 5, 60)
    ) {
      pushCandidate(candidates, {
        field: "travelDistance",
        value: meters,
        confidence: baseConfidence * 0.5,
        source: source.label,
        method: "dimension_length_corridor",
      });
    }
  }
}

function extractFromStructuralElements(
  source: DrawingMeasurementSource,
  candidates: MeasurementCandidate[]
) {
  const baseConfidence = Math.min(0.85, Math.max(0.45, source.confidence ?? source.analysis.confidence));

  for (const element of source.analysis.structuralElements) {
    if (!element.size) continue;
    const coverMatch = element.size.match(/(\d+(?:\.\d+)?)\s*mm/i);
    if (!coverMatch) continue;
    const cover = Number(coverMatch[1]);
    if (!inRange(cover, 10, 80)) continue;
    pushCandidate(candidates, {
      field: "coverThickness",
      value: cover,
      confidence: baseConfidence * 0.65,
      source: source.label,
      method: "structural_element_size",
    });
  }
}

export function extractMeasurementsFromDrawing(
  source: DrawingMeasurementSource
): DrawingMeasurementProvenance[] {
  const candidates: MeasurementCandidate[] = [];
  extractFromTexts(source, candidates);
  extractFromRooms(source, candidates);
  extractFromDimensions(source, candidates);
  extractFromStructuralElements(source, candidates);

  const winners = new Map<ComplianceMeasurementKey, MeasurementCandidate>();
  for (const candidate of candidates) {
    const existing = winners.get(candidate.field);
    if (!existing || candidate.confidence > existing.confidence) {
      winners.set(candidate.field, candidate);
    }
  }

  return Array.from(winners.values()).map((candidate) => ({
    field: candidate.field,
    value: candidate.value,
    confidence: Math.round(candidate.confidence * 100) / 100,
    source: candidate.source,
    method: candidate.method,
  }));
}

export function aggregateMeasurementsFromDrawings(
  sources: DrawingMeasurementSource[]
): DrawingMeasurementExtraction {
  const provenance: DrawingMeasurementProvenance[] = [];
  const measurements: ComplianceMeasurements = {};

  for (const source of sources) {
    const extracted = extractMeasurementsFromDrawing(source);
    for (const item of extracted) {
      const existing = provenance.find((entry) => entry.field === item.field);
      if (!existing || item.confidence > existing.confidence) {
        if (existing) {
          const index = provenance.indexOf(existing);
          provenance[index] = item;
        } else {
          provenance.push(item);
        }
        measurements[item.field] = item.value as never;
      }
    }
  }

  return {
    measurements: stripEmptyMeasurements(measurements),
    provenance,
    drawingCount: sources.length,
  };
}

export function mergeExtractionResults(
  results: DrawingMeasurementExtraction[]
): DrawingMeasurementExtraction {
  const provenance: DrawingMeasurementProvenance[] = [];
  let measurements: ComplianceMeasurements = {};

  for (const result of results) {
    for (const item of result.provenance) {
      const existing = provenance.find((entry) => entry.field === item.field);
      if (!existing || item.confidence > existing.confidence) {
        if (existing) {
          const index = provenance.indexOf(existing);
          provenance[index] = item;
        } else {
          provenance.push(item);
        }
      }
    }
    measurements = mergeMeasurements(measurements, result.measurements);
  }

  return {
    measurements: stripEmptyMeasurements(measurements),
    provenance,
    drawingCount: results.reduce((sum, result) => sum + result.drawingCount, 0),
  };
}
