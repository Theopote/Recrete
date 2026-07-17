import { describe, it, expect } from "vitest";
import { findElevatorCandidateSpaces } from "@/lib/bim/elevator-candidate-finder";
import type { BimRoomInfo } from "@/types/bim";
import {
  ELEVATOR_SHAFT_MIN_DEPTH_M,
  ELEVATOR_SHAFT_MIN_WIDTH_M,
} from "@/lib/ai/compliance/rules/elevator-constants";
import { shaftDimensionsMeetMinimum } from "@/lib/ai/compliance/rules/elevator-dimensions";

function room(
  id: string,
  label: string,
  polygon: { x: number; y: number }[],
  area: number
): BimRoomInfo {
  return { id, label, area, areaUnit: "m2", source: "cad_polyline", polygon };
}

describe("findElevatorCandidateSpaces", () => {
  it("prefers storage/stair keywords and sorts by min side", () => {
    const rooms = [
      room("r1", "三层东南角储藏间", [
        { x: 0, y: 0 },
        { x: 2.4, y: 0 },
        { x: 2.4, y: 2.3 },
        { x: 0, y: 2.3 },
      ], 5.5),
      room("r2", "卫生间", [
        { x: 0, y: 0 },
        { x: 3, y: 0 },
        { x: 3, y: 3 },
        { x: 0, y: 3 },
      ], 9),
      room("r3", "楼梯间", [
        { x: 0, y: 0 },
        { x: 2, y: 0 },
        { x: 2, y: 2.5 },
        { x: 0, y: 2.5 },
      ], 5),
    ];

    const candidates = findElevatorCandidateSpaces(rooms);
    expect(candidates.length).toBe(2);
    expect(candidates[0].label).toContain("储藏");
    expect(candidates.some((c) => c.label.includes("卫生间"))).toBe(false);
  });

  it("accepts near-square 4-8 m² rooms without keyword", () => {
    const side = Math.sqrt(6);
    const candidates = findElevatorCandidateSpaces([
      room("r1", "杂物间", [
        { x: 0, y: 0 },
        { x: side, y: 0 },
        { x: side, y: side },
        { x: 0, y: side },
      ], 6),
    ]);
    expect(candidates.length).toBe(1);
  });

  it("boundary: shaft just meets / just misses minimum", () => {
    const meets = findElevatorCandidateSpaces([
      room("ok", "储藏间", [
        { x: 0, y: 0 },
        { x: ELEVATOR_SHAFT_MIN_WIDTH_M, y: 0 },
        { x: ELEVATOR_SHAFT_MIN_WIDTH_M, y: ELEVATOR_SHAFT_MIN_DEPTH_M },
        { x: 0, y: ELEVATOR_SHAFT_MIN_DEPTH_M },
      ], 2.4),
    ]);
    expect(shaftDimensionsMeetMinimum(meets[0].width, meets[0].depth)).toBe(true);

    const misses = findElevatorCandidateSpaces([
      room("small", "储藏间", [
        { x: 0, y: 0 },
        { x: 1.4, y: 0 },
        { x: 1.4, y: 1.3 },
        { x: 0, y: 1.3 },
      ], 1.8),
    ]);
    const minSide = Math.min(misses[0].width, misses[0].depth);
    expect(minSide).toBeLessThan(ELEVATOR_SHAFT_MIN_WIDTH_M);
  });
});
