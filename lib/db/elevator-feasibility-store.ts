import type { ElevatorFeasibilityResult } from "@/types/elevator-feasibility";

const memoryStore = new Map<string, ElevatorFeasibilityResult>();

export function resetElevatorFeasibilityStore() {
  memoryStore.clear();
}

export async function getElevatorFeasibilityResult(
  projectId: string
): Promise<ElevatorFeasibilityResult | null> {
  return memoryStore.get(projectId) ?? null;
}

export async function saveElevatorFeasibilityResult(
  projectId: string,
  result: ElevatorFeasibilityResult
): Promise<ElevatorFeasibilityResult> {
  memoryStore.set(projectId, result);
  return result;
}
