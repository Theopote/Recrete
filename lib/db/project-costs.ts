import { shouldUseDatabase } from "@/lib/db/resolve";
import type { ProjectCostRecord, ProjectCostRecordWithProject, BenchmarkCalibrationResult } from "@/types/cost";
import type { ProjectStatus } from "@/types";
import * as store from "@/lib/ai/knowledge/cost-record-store";
import {
  recalibrateBenchmarksFromRecords,
  buildProjectCostSnapshot,
} from "@/lib/ai/knowledge/benchmark-calibration";
import * as db from "@/lib/db/prisma-project-costs";
import { getProjectById } from "@/lib/db/repository";
import * as mock from "@/lib/db/mock-repository";

type CostRecordInput = {
  strategyType?: string;
  actualCostPerSqm: number;
  actualTotalCost: number;
  durationMonths?: number;
  outcome: ProjectCostRecord["outcome"];
  notes?: string;
};

async function calibrateFromStore(): Promise<BenchmarkCalibrationResult> {
  return recalibrateBenchmarksFromRecords(store.listAllCostRecords());
}

export async function listProjectCostRecords(projectId?: string): Promise<ProjectCostRecord[]> {
  if (await shouldUseDatabase()) {
    return db.listProjectCostRecords(projectId);
  }
  return projectId ? store.listCostRecordsByProject(projectId) : store.listAllCostRecords();
}

export async function listAllProjectCostRecordsWithProject(): Promise<ProjectCostRecordWithProject[]> {
  if (await shouldUseDatabase()) {
    return db.listAllProjectCostRecordsWithProject();
  }

  const records = store.listAllCostRecords();
  const enriched: ProjectCostRecordWithProject[] = [];
  for (const record of records) {
    const project = await getProjectById(record.projectId);
    enriched.push({
      ...record,
      projectName: project?.name,
      projectCode: project?.code,
      projectLocation: project?.location,
    });
  }
  return enriched;
}

export async function createProjectCostRecord(
  projectId: string,
  input: CostRecordInput,
  options?: { markCompleted?: boolean }
): Promise<{ record: ProjectCostRecord; calibration: BenchmarkCalibrationResult }> {
  const project = await getProjectById(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  if (await shouldUseDatabase()) {
    const result = await db.createProjectCostRecord(projectId, input, project);
    if (options?.markCompleted) {
      await db.updateProjectStatusDb(projectId, "completed");
    }
    return result;
  }

  const snapshot = buildProjectCostSnapshot(project);
  const record = store.createCostRecord({
    projectId,
    strategyType: input.strategyType ?? null,
    actualCostPerSqm: input.actualCostPerSqm,
    actualTotalCost: input.actualTotalCost,
    durationMonths: input.durationMonths ?? null,
    outcome: input.outcome,
    notes: input.notes ?? null,
    ...snapshot,
  });

  if (options?.markCompleted) {
    await updateProjectStatus(projectId, "completed");
  }

  const calibration = calibrateFromStore();
  return { record, calibration: await calibration };
}

export async function updateProjectCostRecord(
  id: string,
  input: Partial<CostRecordInput>
) {
  if (await shouldUseDatabase()) {
    return db.updateProjectCostRecord(id, input);
  }

  const record = store.updateCostRecord(id, {
    strategyType: input.strategyType,
    actualCostPerSqm: input.actualCostPerSqm,
    actualTotalCost: input.actualTotalCost,
    durationMonths: input.durationMonths,
    outcome: input.outcome,
    notes: input.notes,
  });

  return {
    record,
    calibration: await calibrateFromStore(),
  };
}

export async function deleteProjectCostRecord(id: string) {
  if (await shouldUseDatabase()) {
    return db.deleteProjectCostRecord(id);
  }

  const ok = store.deleteCostRecord(id);
  return { ok, calibration: await calibrateFromStore() };
}

export async function updateProjectStatus(projectId: string, status: ProjectStatus): Promise<boolean> {
  if (await shouldUseDatabase()) {
    return db.updateProjectStatusDb(projectId, status);
  }
  return mock.updateProjectStatus(projectId, status);
}
