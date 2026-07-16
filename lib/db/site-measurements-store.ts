import { shouldUseDatabase } from "@/lib/db/resolve";
import {
  countMeasurementCompleteness,
  extractHistoryFallback,
  mergeMeasurements,
  stripEmptyMeasurements,
} from "@/lib/ai/compliance/measurements";
import type { ComplianceMeasurements } from "@/lib/ai/compliance/types";
import type {
  ProjectSiteMeasurementsDto,
  ProjectSiteMeasurementsResponse,
  UpdateProjectSiteMeasurementsInput,
} from "@/types/site-measurements";
import * as db from "@/lib/db/prisma-site-measurements";
import { listComplianceRuns } from "@/lib/db/compliance-store";

const memoryStore = new Map<string, ProjectSiteMeasurementsDto>();

export function resetSiteMeasurementsStore() {
  memoryStore.clear();
}

function emptyDto(projectId: string): ProjectSiteMeasurementsDto {
  return {
    projectId,
    measurements: {},
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    completeness: countMeasurementCompleteness({}),
  };
}

function upsertMemory(
  projectId: string,
  input: UpdateProjectSiteMeasurementsInput,
  replace = false
): ProjectSiteMeasurementsDto {
  const existing = memoryStore.get(projectId) ?? emptyDto(projectId);
  const measurements = replace
    ? stripEmptyMeasurements(input.measurements ?? {})
    : stripEmptyMeasurements(
        mergeMeasurements(existing.measurements, input.measurements ?? {})
      );
  const now = new Date();
  const dto: ProjectSiteMeasurementsDto = {
    projectId,
    measurements,
    notes: input.notes !== undefined ? input.notes : existing.notes,
    createdAt: existing.createdAt,
    updatedAt: now,
    completeness: countMeasurementCompleteness(measurements),
  };
  memoryStore.set(projectId, dto);
  return dto;
}

export async function getProjectSiteMeasurements(
  projectId: string
): Promise<ProjectSiteMeasurementsDto> {
  if (await shouldUseDatabase()) {
    const row = await db.getDbProjectSiteMeasurements(projectId);
    return row ?? emptyDto(projectId);
  }
  return memoryStore.get(projectId) ?? emptyDto(projectId);
}

export async function updateProjectSiteMeasurements(
  projectId: string,
  input: UpdateProjectSiteMeasurementsInput,
  options?: { replace?: boolean }
): Promise<ProjectSiteMeasurementsDto> {
  if (await shouldUseDatabase()) {
    return options?.replace
      ? db.replaceDbProjectSiteMeasurements(projectId, input)
      : db.upsertDbProjectSiteMeasurements(projectId, input);
  }
  return upsertMemory(projectId, input, options?.replace);
}

export async function getProjectSiteMeasurementsWithFallback(
  projectId: string
): Promise<ProjectSiteMeasurementsResponse> {
  const record = await getProjectSiteMeasurements(projectId);
  const runs = await listComplianceRuns(projectId, 1);
  const lastRun = runs[0];
  const historyFallback = extractHistoryFallback(
    record.measurements,
    lastRun?.measurements ?? {}
  );

  return {
    ...record,
    historyFallback,
    historyRunId: lastRun?.id ?? null,
    historyRunCreatedAt: lastRun?.createdAt ?? null,
  };
}

export async function resolveProjectMeasurements(
  projectId: string,
  overrides: ComplianceMeasurements = {}
): Promise<ComplianceMeasurements> {
  const stored = await getProjectSiteMeasurements(projectId);
  const runs = await listComplianceRuns(projectId, 1);
  const fromHistory = runs[0]?.measurements ?? {};
  const base = mergeMeasurements(fromHistory, stored.measurements);
  return stripEmptyMeasurements(mergeMeasurements(base, overrides));
}
