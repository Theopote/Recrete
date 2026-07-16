import { describe, expect, it } from "vitest";
import {
  countMeasurementCompleteness,
  mergeMeasurements,
  parseMeasurementsFromBody,
  stripEmptyMeasurements,
  extractHistoryFallback,
  buildMeasurementCoverage,
} from "@/lib/ai/compliance/measurements";

describe("compliance measurements utils", () => {
  it("parses numeric and boolean fields from request body", () => {
    expect(
      parseMeasurementsFromBody({
        ceilingHeight: "2.9",
        stairWidth: 1.2,
        hasAccessibleEntrance: false,
        existingLoad: 2.5,
        targetLoad: 3.5,
      })
    ).toEqual({
      ceilingHeight: 2.9,
      stairWidth: 1.2,
      hasAccessibleEntrance: false,
      existingLoadKN: 2.5,
      targetLoadKN: 3.5,
    });
  });

  it("merges stored measurements with overrides", () => {
    expect(
      mergeMeasurements(
        { stairWidth: 1.1, ceilingHeight: 2.8 },
        { stairWidth: 1.3 }
      )
    ).toEqual({
      stairWidth: 1.3,
      ceilingHeight: 2.8,
    });
  });

  it("counts completeness including false booleans", () => {
    expect(
      countMeasurementCompleteness({
        stairWidth: 1.2,
        hasAccessibleEntrance: false,
        hasSprinkler: true,
      }).filled
    ).toBe(3);
  });

  it("strips empty values before persistence", () => {
    expect(
      stripEmptyMeasurements({
        stairWidth: 1.2,
        ceilingHeight: undefined,
        hasAccessibleEntrance: false,
      })
    ).toEqual({
      stairWidth: 1.2,
      hasAccessibleEntrance: false,
    });
  });

  it("extracts history fallback only for missing stored fields", () => {
    expect(
      extractHistoryFallback(
        { stairWidth: 1.2 },
        { stairWidth: 1.0, ceilingHeight: 2.9, fireCompartmentArea: 2000 }
      )
    ).toEqual({
      ceilingHeight: 2.9,
      fireCompartmentArea: 2000,
    });
  });

  it("builds measurement coverage from checks", () => {
    const coverage = buildMeasurementCoverage(
      [
        { ruleId: "evacuation-stair-width", status: "compliant" },
        { ruleId: "ceiling-height", status: "requires_verification" },
        { ruleId: "heritage-approval", status: "requires_verification" },
      ],
      { stairWidth: 1.3 }
    );

    expect(coverage.fieldsFilled).toBe(1);
    expect(coverage.dataDependentRules).toBe(2);
    expect(coverage.dataDependentRulesResolved).toBe(1);
    expect(coverage.missingFields).toContain("ceilingHeight");
  });
});
