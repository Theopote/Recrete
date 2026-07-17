import { describe, it, expect } from "vitest";
import {
  ELEVATOR_BIM_MOCK_SCENARIOS,
  ELEVATOR_BIM_MOCK_SCENARIO_META,
  getElevatorMockRooms,
  isElevatorBimMockScenario,
  MOCK_ELEVATOR_BEST_CANDIDATE,
  MOCK_ELEVATOR_TOO_SMALL_CANDIDATE,
} from "@/lib/mock-data/elevator-bim-rooms";
import { findElevatorCandidateSpaces } from "@/lib/bim/elevator-candidate-finder";
import { shaftDimensionsMeetMinimum } from "@/lib/ai/compliance/rules/elevator-dimensions";

describe("elevator-bim mock data", () => {
  it("exposes all documented scenarios", () => {
    const ids = Object.keys(ELEVATOR_BIM_MOCK_SCENARIOS);
    expect(ids).toContain("feasible");
    expect(ids).toContain("infeasible");
    expect(ids).toContain("empty");
    expect(Object.keys(ELEVATOR_BIM_MOCK_SCENARIO_META)).toEqual(ids);
  });

  it("validates scenario id guard", () => {
    expect(isElevatorBimMockScenario("feasible")).toBe(true);
    expect(isElevatorBimMockScenario("unknown")).toBe(false);
  });

  it("feasible scenario has task-book southeast storage room", () => {
    const rooms = getElevatorMockRooms("feasible");
    const storage = rooms.find((r) => r.label.includes("东南角储藏"));
    expect(storage).toBeDefined();
    expect(storage!.area).toBeCloseTo(2.4 * 2.3, 1);
    expect(shaftDimensionsMeetMinimum(2.4, 2.3)).toBe(true);
  });

  it("feasible scenario excludes toilet from candidates", () => {
    const candidates = findElevatorCandidateSpaces(getElevatorMockRooms("feasible"));
    expect(candidates.some((c) => c.label.includes("卫生间"))).toBe(false);
    expect(candidates[0].label).toContain("储藏");
  });

  it("infeasible scenario has no shaft meeting minimum", () => {
    const candidates = findElevatorCandidateSpaces(getElevatorMockRooms("infeasible"));
    expect(candidates.length).toBeGreaterThan(0);
    const best = candidates[0];
    expect(shaftDimensionsMeetMinimum(best.width, best.depth)).toBe(false);
  });

  it("multi_candidate ranks largest min-side first", () => {
    const candidates = findElevatorCandidateSpaces(getElevatorMockRooms("multi_candidate"));
    expect(candidates.length).toBeGreaterThanOrEqual(2);
    const minSide = (c: { width: number; depth: number }) => Math.min(c.width, c.depth);
    expect(minSide(candidates[0])).toBeGreaterThanOrEqual(minSide(candidates[1]));
  });

  it("empty scenario returns no rooms", () => {
    expect(getElevatorMockRooms("empty")).toEqual([]);
  });

  it("exports named convenience candidates", () => {
    expect(MOCK_ELEVATOR_BEST_CANDIDATE.label).toContain("储藏");
    expect(MOCK_ELEVATOR_TOO_SMALL_CANDIDATE.area).toBeLessThan(2);
  });
});
