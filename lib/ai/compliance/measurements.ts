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
  "candidateShaftWidth",
  "candidateShaftDepth",
  "hasLobbySpace",
  "lobbyDepth",
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
    candidateShaftWidth: parseOptionalNumber(body.candidateShaftWidth),
    candidateShaftDepth: parseOptionalNumber(body.candidateShaftDepth),
    hasLobbySpace: parseOptionalBoolean(body.hasLobbySpace),
    lobbyDepth: parseOptionalNumber(body.lobbyDepth),
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
    ratio: filled / total,
  };
}

export function mergeMeasurements(
  base: ComplianceMeasurements = {},
  overrides: ComplianceMeasurements = {}
): ComplianceMeasurements {
  return { ...base, ...stripEmptyMeasurements(overrides) };
}

export interface MeasurementCoverage {
  fieldsFilled: number;
  fieldsTotal: number;
  dataDependentRules: number;
  dataDependentRulesResolved: number;
  missingFields: ComplianceMeasurementKey[];
}

export const RULE_MEASUREMENT_DEPENDENCIES: Partial<
  Record<string, readonly ComplianceMeasurementKey[]>
> = {
  "ceiling-height": ["ceilingHeight"],
  "fire-compartment-area": ["fireCompartmentArea"],
  "evacuation-stair-width": ["stairWidth"],
  "evacuation-travel-distance": ["travelDistance"],
  "concrete-carbonation": ["carbonationDepth"],
  "floor-live-load": ["existingLoadKN"],
  "accessible-entrance": ["hasAccessibleEntrance"],
  "window-u-value": ["windowUValue"],
  "elevator-shaft-dimensions": ["candidateShaftWidth", "candidateShaftDepth"],
  "elevator-lobby-space": ["hasLobbySpace", "lobbyDepth"],
};

export const MEASUREMENT_FIELD_LABELS: Record<
  ComplianceMeasurementKey,
  { en: string; zh: string }
> = {
  ceilingHeight: { en: "Ceiling height", zh: "房间净高" },
  stairWidth: { en: "Stair clear width", zh: "疏散楼梯净宽" },
  fireCompartmentArea: { en: "Fire compartment area", zh: "防火分区面积" },
  hasAccessibleEntrance: { en: "Accessible entrance", zh: "无障碍入口" },
  windowUValue: { en: "Window U-value", zh: "外窗传热系数" },
  carbonationDepth: { en: "Carbonation depth", zh: "碳化深度" },
  coverThickness: { en: "Cover thickness", zh: "保护层厚度" },
  existingLoadKN: { en: "Existing live load", zh: "现有活荷载" },
  targetLoadKN: { en: "Target live load", zh: "目标活荷载" },
  travelDistance: { en: "Travel distance", zh: "疏散距离" },
  hasSprinkler: { en: "Sprinkler system", zh: "喷淋系统" },
  candidateShaftWidth: { en: "Candidate shaft width", zh: "候选井道宽度" },
  candidateShaftDepth: { en: "Candidate shaft depth", zh: "候选井道进深" },
  hasLobbySpace: { en: "Elevator lobby space", zh: "候梯厅空间" },
  lobbyDepth: { en: "Lobby depth", zh: "候梯厅深度" },
};

export function stripEmptyMeasurements(
  measurements: ComplianceMeasurements
): ComplianceMeasurements {
  return Object.fromEntries(
    COMPLIANCE_MEASUREMENT_KEYS.filter((key) =>
      isMeasurementValueSet(key, measurements[key])
    ).map((key) => [key, measurements[key]])
  ) as ComplianceMeasurements;
}

export function listMissingMeasurementFields(
  measurements: ComplianceMeasurements = {}
): ComplianceMeasurementKey[] {
  return COMPLIANCE_MEASUREMENT_KEYS.filter(
    (key) => !isMeasurementValueSet(key, measurements[key])
  );
}

export function extractHistoryFallback(
  stored: ComplianceMeasurements,
  history: ComplianceMeasurements = {}
): ComplianceMeasurements {
  return Object.fromEntries(
    COMPLIANCE_MEASUREMENT_KEYS.filter(
      (key) =>
        !isMeasurementValueSet(key, stored[key]) &&
        isMeasurementValueSet(key, history[key])
    ).map((key) => [key, history[key]])
  ) as ComplianceMeasurements;
}

export function buildMeasurementCoverage(
  checks: Array<{ ruleId: string; status: string }>,
  measurements: ComplianceMeasurements = {}
): MeasurementCoverage {
  const completeness = countMeasurementCompleteness(measurements);
  const dataDependentRuleIds = new Set(Object.keys(RULE_MEASUREMENT_DEPENDENCIES));
  const applicableDataRules = checks.filter((check) =>
    dataDependentRuleIds.has(check.ruleId)
  );
  const resolved = applicableDataRules.filter(
    (check) => check.status !== "requires_verification"
  );

  return {
    fieldsFilled: completeness.filled,
    fieldsTotal: completeness.total,
    dataDependentRules: applicableDataRules.length,
    dataDependentRulesResolved: resolved.length,
    missingFields: listMissingMeasurementFields(measurements),
  };
}
