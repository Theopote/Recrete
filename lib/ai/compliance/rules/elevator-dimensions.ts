import {
  ELEVATOR_SHAFT_MIN_DEPTH_M,
  ELEVATOR_SHAFT_MIN_WIDTH_M,
} from "@/lib/ai/compliance/rules/elevator-constants";

export function shaftDimensionsMeetMinimum(width: number, depth: number): boolean {
  const minSide = Math.min(width, depth);
  const maxSide = Math.max(width, depth);
  const requiredMin = Math.min(ELEVATOR_SHAFT_MIN_WIDTH_M, ELEVATOR_SHAFT_MIN_DEPTH_M);
  const requiredMax = Math.max(ELEVATOR_SHAFT_MIN_WIDTH_M, ELEVATOR_SHAFT_MIN_DEPTH_M);
  return minSide >= requiredMin && maxSide >= requiredMax;
}

export function formatShaftDimensionGap(width: number, depth: number): string {
  const required = `${ELEVATOR_SHAFT_MIN_WIDTH_M}m × ${ELEVATOR_SHAFT_MIN_DEPTH_M}m`;
  return `${width.toFixed(2)}m × ${depth.toFixed(2)}m (required ≥${required})`;
}
