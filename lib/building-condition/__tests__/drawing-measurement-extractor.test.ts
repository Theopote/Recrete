import { describe, it, expect } from "vitest";
import {
  aggregateMeasurementsFromDrawings,
  extractMeasurementsFromDrawing,
} from "@/lib/building-condition/drawing-measurement-extractor";
import { mockDrawingAssetsByProject } from "@/lib/mock-data/drawing-assets";

describe("drawing measurement extractor", () => {
  it("extracts stair width from stair room and fire compartment from annotation", () => {
    const floorPlan = mockDrawingAssetsByProject("proj-demo").find(
      (asset) => asset.drawingType === "floor_plan"
    );
    expect(floorPlan).toBeTruthy();

    const provenance = extractMeasurementsFromDrawing({
      drawingType: floorPlan!.drawingType,
      label: "floor_plan p1",
      confidence: floorPlan!.confidence,
      analysis: floorPlan!.analysisResult,
    });

    expect(provenance.find((item) => item.field === "stairWidth")?.value).toBe(1.2);
    expect(provenance.find((item) => item.field === "fireCompartmentArea")?.value).toBe(1850);
    expect(provenance.find((item) => item.field === "travelDistance")?.value).toBe(28);
    expect(provenance.find((item) => item.field === "hasAccessibleEntrance")?.value).toBe(true);
  });

  it("extracts ceiling height from section drawing", () => {
    const section = mockDrawingAssetsByProject("proj-demo").find(
      (asset) => asset.drawingType === "section"
    );
    expect(section).toBeTruthy();

    const provenance = extractMeasurementsFromDrawing({
      drawingType: section!.drawingType,
      label: "section p3",
      confidence: section!.confidence,
      analysis: section!.analysisResult,
    });

    expect(provenance.find((item) => item.field === "ceilingHeight")?.value).toBe(2.9);
  });

  it("aggregates highest-confidence values across all demo drawings", () => {
    const assets = mockDrawingAssetsByProject("proj-demo");
    const extraction = aggregateMeasurementsFromDrawings(
      assets.map((asset) => ({
        drawingId: asset.id,
        drawingType: asset.drawingType,
        label: `${asset.drawingType} p${asset.pageNumber}`,
        confidence: asset.confidence,
        analysis: asset.analysisResult,
      }))
    );

    expect(extraction.measurements.stairWidth).toBe(1.2);
    expect(extraction.measurements.ceilingHeight).toBe(2.9);
    expect(extraction.measurements.fireCompartmentArea).toBe(1850);
    expect(extraction.measurements.existingLoadKN).toBe(2);
    expect(extraction.measurements.coverThickness).toBe(25);
    expect(extraction.measurements.hasSprinkler).toBe(true);
    expect(extraction.provenance.length).toBeGreaterThanOrEqual(7);
  });
});
