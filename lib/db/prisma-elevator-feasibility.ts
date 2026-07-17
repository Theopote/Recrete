import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";
import type { ElevatorFeasibilityResult } from "@/types/elevator-feasibility";

function parseResult(value: Prisma.JsonValue): ElevatorFeasibilityResult {
  return value as unknown as ElevatorFeasibilityResult;
}

export async function getDbElevatorFeasibilityResult(
  projectId: string
): Promise<ElevatorFeasibilityResult | null> {
  const row = await prisma.projectElevatorFeasibility.findUnique({ where: { projectId } });
  return row ? parseResult(row.result) : null;
}

export async function upsertDbElevatorFeasibilityResult(
  projectId: string,
  result: ElevatorFeasibilityResult
): Promise<ElevatorFeasibilityResult> {
  const row = await prisma.projectElevatorFeasibility.upsert({
    where: { projectId },
    create: {
      projectId,
      verdict: result.verdict,
      result: result as unknown as Prisma.InputJsonValue,
    },
    update: {
      verdict: result.verdict,
      result: result as unknown as Prisma.InputJsonValue,
    },
  });
  return parseResult(row.result);
}

export async function deleteDbElevatorFeasibilityResult(projectId: string): Promise<boolean> {
  try {
    await prisma.projectElevatorFeasibility.delete({ where: { projectId } });
    return true;
  } catch {
    return false;
  }
}
