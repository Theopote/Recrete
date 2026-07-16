import type { ComplianceMeasurements } from "./types";

export const COMPLIANCE_MEASUREMENT_KEYS = [
  "ceilingHeight",
  "stairWidth",
  "fireCompartmentArea",
  "hasAccessibleEntrance",
  "windowUValue",
  "carbonationDepth",
  "coverThickness",
  "existingLoadKN",
  "targetLoadKN",
  "travelDistance",
  "hasSprinkler",
] as const satisfies readonly (keyof ComplianceMeasurements)[];

export type ComplianceMeasurementKey = (typeof COMPLIANCE_MEASUREMENT_KEYS)[number];

export interface MeasurementCompleteness {
  filled: number;
  total: number;
  ratio: number;
}

function parseOptionalNumber(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function parseOptionalBoolean(value: unknown): boolean | undefined {
  if (value == null || value === "") return undefined;
  return Boolean(value);
}

export function parseMeasurementsFromBody(
  body: Record<string, unknown>
): ComplianceMeasurements {
  return {
    ceilingHeight: parseOptionalNumber(body.ceilingHeight),
    stairWidth: parseOptionalNumber(body.stairWidth),
    fireCompartmentArea: parseOptionalNumber(body.fireCompartmentArea),
    hasAccessibleEntrance: parseOptionalBoolean(body.hasAccessibleEntrance),
    windowUValue: parseOptionalNumber(body.windowUValue),
    carbonationDepth: parseOptionalNumber(body.carbonationDepth),
    coverThickness: parseOptionalNumber(body.coverThickness),
    existingLoadKN: parseOptionalNumber(body.existingLoadKN ?? body.existingLoad),
    targetLoadKN: parseOptionalNumber(body.targetLoadKN ?? body.targetLoad),
    travelDistance: parseOptionalNumber(body.travelDistance),
    hasSprinkler: parseOptionalBoolean(body.hasSprinkler),
  };
}

export function isMeasurementValueSet(
  key: ComplianceMeasurementKey,
  value: ComplianceMeasurements[ComplianceMeasurementKey]
): boolean {
  if (value == null) return false;
  if (typeof value === "boolean") return true;
  return Number.isFinite(value);
}

export function countMeasurementCompleteness(
  measurements: ComplianceMeasurements = {}
): MeasurementCompleteness {
  const filled = COMPLIANCE_MEASUREMENT_KEYS.filter((key) =>
    isMeasurementValueSet(key, measurements[key])
  ).length;
  const total = COMPLIANCE_MEASUREMENT_KEYS.length;
  return {
    filled,
    total,
    ratio: total === 0 ? 0 : filled / total,
  };
}

export function mergeMeasurements(
  base: ComplianceMeasurements = {},
  overrides: ComplianceMeasurements = {}
): ComplianceMeasurements {
  const merged: ComplianceMeasurements = { ...base };
  for (const key of COMPLIANCE_MEASUREMENT_KEYS) {
    const value = overrides[key];
    if (value !== undefined) {
      merged[key] = value;
    }
  }
  return merged;
}

export function stripEmptyMeasurements(
  measurements: ComplianceMeasurements
): ComplianceMeasurements {
  const result: ComplianceMeasurements = {};
  for (const key of COMPLIANCE_MEASUREMENT_KEYS) {
    const value = measurements[key];
    if (isMeasurementValueSet(key, value)) {
      result[key] = value;
    }
  }
  return result;
}
