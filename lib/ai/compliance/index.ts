export {
  runComplianceEngine,
  getApplicableCodesForProject,
  getScenariosForProject,
  getComplianceChecklist,
  COMPLIANCE_ENGINE_VERSION,
} from "./engine";

export type {
  ComplianceCategory,
  ComplianceStatus,
  CompliancePriority,
  OverallCompliance,
  ComplianceMeasurements,
  ComplianceContext,
  ComplianceCheck,
  ComplianceEngineReport,
  ComplianceEngineOptions,
  ComplianceRuleDefinition,
  ComplianceCheckResult,
} from "./types";

export { resolveComplianceScenarios, isPublicTargetFunction, hasHeritageConstraints } from "./scenario-resolver";
export { resolveClimateZone, maxWindowUValue, minCeilingHeight } from "./climate-zones";
export { allComplianceRules, getRulesForScenarios, getRulesByCategory } from "./rules";
export {
  COMPLIANCE_MEASUREMENT_KEYS,
  parseMeasurementsFromBody,
  mergeMeasurements,
  countMeasurementCompleteness,
  stripEmptyMeasurements,
  buildMeasurementCoverage,
  extractHistoryFallback,
  listMissingMeasurementFields,
  MEASUREMENT_FIELD_LABELS,
  RULE_MEASUREMENT_DEPENDENCIES,
} from "./measurements";
export type {
  ComplianceMeasurementKey,
  MeasurementCompleteness,
  MeasurementCoverage,
} from "./measurements";
