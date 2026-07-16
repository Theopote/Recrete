import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";
import {
  parseFromStorage,
  parseListFromStorage,
  serializeForStorage,
  serializeListForStorage,
} from "@/lib/i18n/bilingual";
import type {
  ComplianceCheckRunDto,
  ComplianceCheckRecordDto,
  SaveComplianceRunInput,
} from "@/types/compliance";
import type { ComplianceEngineReport } from "@/lib/ai/compliance/types";

function mapCheck(row: {
  id: string;
  runId: string;
  projectId: string;
  ruleId: string;
  category: string;
  codeRef: string;
  codeId: string;
  section: string;
  requirement: string;
  requirementZh: string;
  status: string;
  actualValue: string | null;
  requiredValue: string;
  note: string;
  noteZh: string | null;
  priority: string;
  remediation: string | null;
}): ComplianceCheckRecordDto {
  return {
    id: row.id,
    runId: row.runId,
    projectId: row.projectId,
    ruleId: row.ruleId,
    category: row.category,
    codeRef: row.codeRef,
    codeId: row.codeId,
    section: row.section,
    requirement: row.requirement,
    requirementZh: row.requirementZh,
    status: row.status,
    actualValue: row.actualValue,
    requiredValue: row.requiredValue,
    note: row.note,
    noteZh: row.noteZh,
    priority: row.priority,
    remediation: parseFromStorage(row.remediation) ?? null,
  };
}

function mapRun(
  row: {
    id: string;
    projectId: string;
    engineVersion: string;
    overallCompliance: string;
    scenarios: string[];
    climateZone: string;
    measurements: Prisma.JsonValue;
    summary: Prisma.JsonValue;
    criticalIssues: string[];
    recommendations: string[];
    diagnosisApplied: boolean;
    diagnosisCount: number;
    createdAt: Date;
  },
  checks?: ComplianceCheckRecordDto[]
): ComplianceCheckRunDto {
  return {
    id: row.id,
    projectId: row.projectId,
    engineVersion: row.engineVersion,
    overallCompliance: row.overallCompliance as ComplianceEngineReport["overallCompliance"],
    scenarios: row.scenarios,
    climateZone: row.climateZone,
    measurements: (row.measurements as SaveComplianceRunInput["measurements"]) ?? null,
    summary: row.summary as ComplianceEngineReport["summary"],
    criticalIssues: parseListFromStorage(row.criticalIssues),
    recommendations: parseListFromStorage(row.recommendations),
    diagnosisApplied: row.diagnosisApplied,
    diagnosisCount: row.diagnosisCount,
    createdAt: row.createdAt,
    checks,
  };
}

export async function createDbComplianceRun(
  input: SaveComplianceRunInput
): Promise<ComplianceCheckRunDto> {
  const { projectId, report, measurements } = input;

  const row = await prisma.complianceCheckRun.create({
    data: {
      projectId,
      engineVersion: report.engineVersion,
      overallCompliance: report.overallCompliance,
      scenarios: report.scenarios,
      climateZone: report.climateZone,
      measurements: measurements ? (measurements as Prisma.InputJsonValue) : undefined,
      summary: report.summary as Prisma.InputJsonValue,
      criticalIssues: serializeListForStorage(report.criticalIssues),
      recommendations: serializeListForStorage(report.recommendations),
      checks: {
        create: report.checks.map((check) => ({
          projectId,
          ruleId: check.ruleId,
          category: check.category,
          codeRef: check.code,
          codeId: check.codeId,
          section: check.section,
          requirement: check.requirement,
          requirementZh: check.requirementZh,
          status: check.status,
          actualValue: check.actualValue ?? null,
          requiredValue: check.requiredValue,
          note: check.note,
          noteZh: check.noteZh ?? null,
          priority: check.priority,
          remediation: serializeForStorage(check.remediation),
        })),
      },
    },
    include: { checks: true },
  });

  return mapRun(row, row.checks.map(mapCheck));
}

export async function getDbComplianceRun(runId: string): Promise<ComplianceCheckRunDto | null> {
  const row = await prisma.complianceCheckRun.findUnique({
    where: { id: runId },
    include: { checks: true },
  });
  if (!row) return null;
  return mapRun(row, row.checks.map(mapCheck));
}

export async function listDbComplianceRuns(
  projectId: string,
  limit = 10
): Promise<ComplianceCheckRunDto[]> {
  const rows = await prisma.complianceCheckRun.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { checks: true },
  });

  return rows.map((row) => mapRun(row, row.checks.map(mapCheck)));
}

export async function markDbComplianceRunDiagnosisApplied(
  runId: string,
  diagnosisCount: number
): Promise<ComplianceCheckRunDto | null> {
  try {
    const row = await prisma.complianceCheckRun.update({
      where: { id: runId },
      data: {
        diagnosisApplied: true,
        diagnosisCount,
      },
      include: { checks: true },
    });
    return mapRun(row, row.checks.map(mapCheck));
  } catch {
    return null;
  }
}
