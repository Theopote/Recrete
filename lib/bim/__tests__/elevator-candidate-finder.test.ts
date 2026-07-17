import { describe, it, expect } from "vitest";
import { findElevatorCandidateSpaces } from "@/lib/bim/elevator-candidate-finder";
import {
  getElevatorMockRooms,
  MOCK_ELEVATOR_BEST_CANDIDATE,
} from "@/lib/mock-data/elevator-bim-rooms";
import { shaftDimensionsMeetMinimum } from "@/lib/ai/compliance/rules/elevator-dimensions";

describe("findElevatorCandidateSpaces", () => {
  it("prefers storage/stair keywords and sorts by min side", () => {
    const candidates = findElevatorCandidateSpaces(getElevatorMockRooms("feasible"));
    expect(candidates.length).toBeGreaterThanOrEqual(2);
    expect(candidates[0].label).toContain("储藏");
    expect(candidates.some((c) => c.label.includes("卫生间"))).toBe(false);
  });

  it("accepts near-square 4-8 m² rooms without keyword", () => {
    const side = Math.sqrt(6);
    const candidates = findElevatorCandidateSpaces([
      {
        id: "r1",
        label: "杂物间",
        area: 6,
        areaUnit: "m2",
        source: "cad_polyline",
        polygon: [
          { x: 0, y: 0 },
          { x: side, y: 0 },
          { x: side, y: side },
          { x: 0, y: side },
        ],
      },
    ]);
    expect(candidates.length).toBe(1);
  });

  it("boundary: shaft just meets / just misses minimum", () => {
    const meets = findElevatorCandidateSpaces([
      {
        id: "ok",
        label: "储藏间",
        area: 2.4,
        areaUnit: "m2",
        source: "cad_polyline",
        polygon: [
          { x: 0, y: 0 },
          { x: 1.6, y: 0 },
          { x: 1.6, y: 1.5 },
          { x: 0, y: 1.5 },
        ],
      },
    ]);
    expect(shaftDimensionsMeetMinimum(meets[0].width, meets[0].depth)).toBe(true);

    const misses = findElevatorCandidateSpaces(getElevatorMockRooms("infeasible"));
    const minSide = Math.min(misses[0].width, misses[0].depth);
    expect(minSide).toBeLessThan(1.6);
  });

  it("mock best candidate matches task-book dimensions", () => {
    const room = MOCK_ELEVATOR_BEST_CANDIDATE;
    expect(room.area).toBeCloseTo(5.52, 1);
    expect(shaftDimensionsMeetMinimum(2.4, 2.3)).toBe(true);
  });
});
