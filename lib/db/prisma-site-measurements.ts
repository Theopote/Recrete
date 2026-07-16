import { prisma } from "@/lib/db/prisma";
import {
  countMeasurementCompleteness,
  stripEmptyMeasurements,
} from "@/lib/ai/compliance/measurements";
import type { ComplianceMeasurements } from "@/lib/ai/compliance/types";
import type {
  ProjectSiteMeasurementsDto,
  UpdateProjectSiteMeasurementsInput,
} from "@/types/site-measurements";

function rowToMeasurements(row: {
  ceilingHeight: number | null;
  stairWidth: number | null;
  fireCompartmentArea: number | null;
  hasAccessibleEntrance: boolean | null;
  windowUValue: number | null;
  carbonationDepth: number | null;
  coverThickness: number | null;
  existingLoadKN: number | null;
  targetLoadKN: number | null;
  travelDistance: number | null;
  hasSprinkler: boolean | null;
}): ComplianceMeasurements {
  const measurements: ComplianceMeasurements = {};
  if (row.ceilingHeight != null) measurements.ceilingHeight = row.ceilingHeight;
  if (row.stairWidth != null) measurements.stairWidth = row.stairWidth;
  if (row.fireCompartmentArea != null) measurements.fireCompartmentArea = row.fireCompartmentArea;
  if (row.hasAccessibleEntrance != null) {
    measurements.hasAccessibleEntrance = row.hasAccessibleEntrance;
  }
  if (row.windowUValue != null) measurements.windowUValue = row.windowUValue;
  if (row.carbonationDepth != null) measurements.carbonationDepth = row.carbonationDepth;
  if (row.coverThickness != null) measurements.coverThickness = row.coverThickness;
  if (row.existingLoadKN != null) measurements.existingLoadKN = row.existingLoadKN;
  if (row.targetLoadKN != null) measurements.targetLoadKN = row.targetLoadKN;
  if (row.travelDistance != null) measurements.travelDistance = row.travelDistance;
  if (row.hasSprinkler != null) measurements.hasSprinkler = row.hasSprinkler;
  return measurements;
}

function mapRow(row: {
  projectId: string;
  ceilingHeight: number | null;
  stairWidth: number | null;
  fireCompartmentArea: number | null;
  hasAccessibleEntrance: boolean | null;
  windowUValue: number | null;
  carbonationDepth: number | null;
  coverThickness: number | null;
  existingLoadKN: number | null;
  targetLoadKN: number | null;
  travelDistance: number | null;
  hasSprinkler: boolean | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ProjectSiteMeasurementsDto {
  const measurements = rowToMeasurements(row);
  return {
    projectId: row.projectId,
    measurements,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    completeness: countMeasurementCompleteness(measurements),
  };
}

function measurementsToData(measurements: ComplianceMeasurements) {
  return {
    ceilingHeight: measurements.ceilingHeight ?? null,
    stairWidth: measurements.stairWidth ?? null,
    fireCompartmentArea: measurements.fireCompartmentArea ?? null,
    hasAccessibleEntrance: measurements.hasAccessibleEntrance ?? null,
    windowUValue: measurements.windowUValue ?? null,
    carbonationDepth: measurements.carbonationDepth ?? null,
    coverThickness: measurements.coverThickness ?? null,
    existingLoadKN: measurements.existingLoadKN ?? null,
    targetLoadKN: measurements.targetLoadKN ?? null,
    travelDistance: measurements.travelDistance ?? null,
    hasSprinkler: measurements.hasSprinkler ?? null,
  };
}

export async function getDbProjectSiteMeasurements(
  projectId: string
): Promise<ProjectSiteMeasurementsDto | null> {
  const row = await prisma.projectSiteMeasurements.findUnique({ where: { projectId } });
  return row ? mapRow(row) : null;
}

export async function upsertDbProjectSiteMeasurements(
  projectId: string,
  input: UpdateProjectSiteMeasurementsInput
): Promise<ProjectSiteMeasurementsDto> {
  const existing = await prisma.projectSiteMeasurements.findUnique({ where: { projectId } });
  const mergedMeasurements = stripEmptyMeasurements({
    ...(existing ? rowToMeasurements(existing) : {}),
    ...(input.measurements ?? {}),
  });

  const row = await prisma.projectSiteMeasurements.upsert({
    where: { projectId },
    create: {
      projectId,
      ...measurementsToData(mergedMeasurements),
      notes: input.notes ?? null,
    },
    update: {
      ...measurementsToData(mergedMeasurements),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
  });

  return mapRow(row);
}

export async function replaceDbProjectSiteMeasurements(
  projectId: string,
  input: UpdateProjectSiteMeasurementsInput
): Promise<ProjectSiteMeasurementsDto> {
  const measurements = stripEmptyMeasurements(input.measurements ?? {});
  const row = await prisma.projectSiteMeasurements.upsert({
    where: { projectId },
    create: {
      projectId,
      ...measurementsToData(measurements),
      notes: input.notes ?? null,
    },
    update: {
      ...measurementsToData(measurements),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
  });

  return mapRow(row);
}
