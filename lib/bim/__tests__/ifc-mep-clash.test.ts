import { describe, it, expect } from "vitest";
import {
  aabbIntersects,
  computeOverlapVolume,
  detectIfcAabbClashes,
  ifcClashPairsToMepClashItems,
} from "@/lib/bim/ifc-mep-clash";
import type { BimIfcElement } from "@/types/bim";

function element(
  expressId: number,
  discipline: BimIfcElement["discipline"],
  min: [number, number, number],
  max: [number, number, number]
): BimIfcElement {
  return {
    id: `ifc-${expressId}`,
    expressId,
    ifcType: discipline === "structure" ? "IfcBeam" : "IfcDuctSegment",
    label: `Element ${expressId}`,
    discipline,
    bbox: {
      min: { x: min[0], y: min[1], z: min[2] },
      max: { x: max[0], y: max[1], z: max[2] },
    },
  };
}

describe("ifc aabb clash detection", () => {
  it("detects intersection between overlapping boxes", () => {
    const a = {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 2, y: 2, z: 2 },
    };
    const b = {
      min: { x: 1, y: 1, z: 1 },
      max: { x: 3, y: 3, z: 3 },
    };
    expect(aabbIntersects(a, b)).toBe(true);
    expect(computeOverlapVolume(a, b)).toBe(1);
  });

  it("returns no clash for separated boxes", () => {
    const elements = [
      element(1, "hvac", [0, 0, 0], [1, 1, 1]),
      element(2, "structure", [5, 5, 5], [6, 6, 6]),
    ];
    expect(detectIfcAabbClashes(elements)).toHaveLength(0);
  });

  it("detects mep vs structure clash", () => {
    const elements = [
      element(10, "hvac", [0, 0, 0], [2, 0.5, 0.5]),
      element(20, "structure", [1.5, 0, 0], [3, 1, 1]),
    ];
    const clashes = detectIfcAabbClashes(elements, { clearanceMm: 0 });
    expect(clashes).toHaveLength(1);
    expect(clashes[0]?.elementA.expressId).toBe(10);
    expect(clashes[0]?.elementB.expressId).toBe(20);
  });

  it("converts ifc clash pairs to bilingual mep clash items", () => {
    const elements = [
      element(10, "hvac", [0, 0, 0], [2, 0.5, 0.5]),
      element(20, "structure", [1.5, 0, 0], [3, 1, 1]),
    ];
    const pairs = detectIfcAabbClashes(elements, { clearanceMm: 0 });
    const items = ifcClashPairsToMepClashItems(pairs, "model-1");
    expect(items[0]?.type).toBe("ifc_geometry_clash");
    expect(items[0]?.modelId).toBe("model-1");
    expect(items[0]?.title).toMatchObject({ en: expect.any(String), zh: expect.any(String) });
    expect(items[0]?.elementA?.expressId).toBe(10);
  });
});
