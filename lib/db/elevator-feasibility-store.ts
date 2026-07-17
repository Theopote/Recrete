import { shouldUseDatabase } from "@/lib/db/resolve";
import type { ElevatorFeasibilityResult } from "@/types/elevator-feasibility";
import * as db from "@/lib/db/prisma-elevator-feasibility";

const memoryStore = new Map<string, ElevatorFeasibilityResult>();

export function resetElevatorFeasibilityStore() {
  memoryStore.clear();
}

export async function getElevatorFeasibilityResult(
  projectId: string
): Promise<ElevatorFeasibilityResult | null> {
  if (await shouldUseDatabase()) {
    return db.getDbElevatorFeasibilityResult(projectId);
  }
  return memoryStore.get(projectId) ?? null;
}

export async function saveElevatorFeasibilityResult(
  projectId: string,
  result: ElevatorFeasibilityResult
): Promise<ElevatorFeasibilityResult> {
  if (await shouldUseDatabase()) {
    return db.upsertDbElevatorFeasibilityResult(projectId, result);
  }
  memoryStore.set(projectId, result);
  return result;
}
