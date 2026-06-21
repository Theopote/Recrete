import type { ProjectCostRecord, ProjectCostRecordWithProject } from "@/types/cost";
import type { ProjectStatus } from "@/types";
import {
  createCostRecord,
  deleteCostRecord,
  getCostRecordById,
  hydrateCostRecordStore,
  listAllCostRecords,
  listCostRecordsByProject,
  updateCostRecord,
} from "@/lib/ai/knowledge/cost-record-store";
import {
  recalibrateBenchmarksFromRecords,
  buildProjectCostSnapshot,
} from "@/lib/ai/knowledge/benchmark-calibration";
import { prisma } from "@/lib/db/prisma";

function toRecord(row: {
  id: string;
  projectId: string;
  strategyType: string | null;
  actualCostPerSqm: number;
  actualTotalCost: number;
  durationMonths: number | null;
  outcome: string;
  notes: string | null;
  region: string;
  city: string | null;
  buildingType: string;
  grossFloorArea: number;
  recordedAt: Date;
  createdAt: Date;
}): ProjectCostRecord {
  return {
    id: row.id,
    projectId: row.projectId,
    strategyType: row.strategyType,
    actualCostPerSqm: row.actualCostPerSqm,
    actualTotalCost: row.actualTotalCost,
    durationMonths: row.durationMonths,
    outcome: row.outcome as ProjectCostRecord["outcome"],
    notes: row.notes,
    region: row.region,
    city: row.city,
    buildingType: row.buildingType,
    grossFloorArea: row.grossFloorArea,
    recordedAt: row.recordedAt,
    createdAt: row.createdAt,
  };
}

async function syncStoreFromDb(): Promise<ProjectCostRecord[]> {
  const rows = await prisma.projectCostRecord.findMany({ orderBy: { recordedAt: "desc" } });
  const records = rows.map(toRecord);
  hydrateCostRecordStore(records);
  return records;
}

async function runCalibration() {
  const records = await syncStoreFromDb();
  return recalibrateBenchmarksFromRecords(records);
}

export async function listProjectCostRecords(projectId?: string): Promise<ProjectCostRecord[]> {
  if (projectId) {
    const rows = await prisma.projectCostRecord.findMany({
      where: { projectId },
      orderBy: { recordedAt: "desc" },
    });
    return rows.map(toRecord);
  }
  return syncStoreFromDb();
}

export async function listAllProjectCostRecordsWithProject(): Promise<ProjectCostRecordWithProject[]> {
  const rows = await prisma.projectCostRecord.findMany({
    orderBy: { recordedAt: "desc" },
    include: { project: { select: { name: true, code: true, location: true } } },
  });
  return rows.map((row) => ({
    ...toRecord(row),
    projectName: row.project.name,
    projectCode: row.project.code,
    projectLocation: row.project.location,
  }));
}

export async function createProjectCostRecord(
  projectId: string,
  input: {
    strategyType?: string;
    actualCostPerSqm: number;
    actualTotalCost: number;
    durationMonths?: number;
    outcome: ProjectCostRecord["outcome"];
    notes?: string;
  },
  project: { location: string; buildingType: string; grossFloorArea: number }
) {
  const snapshot = buildProjectCostSnapshot(project);
  const row = await prisma.projectCostRecord.create({
    data: {
      projectId,
      strategyType: input.strategyType ?? null,
      actualCostPerSqm: input.actualCostPerSqm,
      actualTotalCost: input.actualTotalCost,
      durationMonths: input.durationMonths ?? null,
      outcome: input.outcome,
      notes: input.notes ?? null,
      region: snapshot.region,
      city: snapshot.city,
      buildingType: snapshot.buildingType,
      grossFloorArea: snapshot.grossFloorArea,
    },
  });
  const record = toRecord(row);
  const calibration = await runCalibration();
  return { record, calibration };
}

export async function updateProjectCostRecord(
  id: string,
  input: Partial<{
    strategyType: string;
    actualCostPerSqm: number;
    actualTotalCost: number;
    durationMonths: number;
    outcome: ProjectCostRecord["outcome"];
    notes: string;
  }>
) {
  try {
    const row = await prisma.projectCostRecord.update({
      where: { id },
      data: {
        strategyType: input.strategyType,
        actualCostPerSqm: input.actualCostPerSqm,
        actualTotalCost: input.actualTotalCost,
        durationMonths: input.durationMonths,
        outcome: input.outcome,
        notes: input.notes,
        recordedAt: new Date(),
      },
    });
    const calibration = await runCalibration();
    return { record: toRecord(row), calibration };
  } catch {
    return { record: null, calibration: recalibrateBenchmarksFromRecords(await syncStoreFromDb()) };
  }
}

export async function deleteProjectCostRecord(id: string) {
  try {
    await prisma.projectCostRecord.delete({ where: { id } });
    const calibration = await runCalibration();
    return { ok: true, calibration };
  } catch {
    return { ok: false, calibration: recalibrateBenchmarksFromRecords(await syncStoreFromDb()) };
  }
}

export async function getProjectCostRecordById(id: string): Promise<ProjectCostRecord | null> {
  const row = await prisma.projectCostRecord.findUnique({ where: { id } });
  return row ? toRecord(row) : null;
}

export async function updateProjectStatusDb(projectId: string, status: ProjectStatus): Promise<boolean> {
  try {
    await prisma.project.update({ where: { id: projectId }, data: { status } });
    return true;
  } catch {
    return false;
  }
}

export { buildProjectCostSnapshot };
