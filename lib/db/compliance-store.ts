import { shouldUseDatabase } from "@/lib/db/resolve";
import { getProjectById, addDiagnosisItems } from "@/lib/db/repository";
import { generateId } from "@/lib/mock-data";
import type { DiagnosisItem } from "@/types";
import type {
  ApplyComplianceDiagnosisResult,
  ComplianceCheckRunDto,
  PersistComplianceResult,
  SaveComplianceRunInput,
} from "@/types/compliance";
import * as db from "@/lib/db/prisma-compliance";

let memoryRuns: ComplianceCheckRunDto[] = [];

export function resetComplianceStore() {
  memoryRuns = [];
}

function createMemoryRun(input: SaveComplianceRunInput): ComplianceCheckRunDto {
  const runId = generateId("comp-run");
  const now = new Date();
  const checks = input.report.checks.map((check) => ({
    id: generateId("comp-chk"),
    runId,
    projectId: input.projectId,
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
    remediation: check.remediation ?? null,
  }));

  const run: ComplianceCheckRunDto = {
    id: runId,
    projectId: input.projectId,
    engineVersion: input.report.engineVersion,
    overallCompliance: input.report.overallCompliance,
    scenarios: input.report.scenarios,
    climateZone: input.report.climateZone,
    measurements: input.measurements ?? null,
    summary: input.report.summary,
    criticalIssues: input.report.criticalIssues,
    recommendations: input.report.recommendations,
    diagnosisApplied: false,
    diagnosisCount: 0,
    createdAt: now,
    checks,
  };

  memoryRuns.unshift(run);
  return run;
}

function tagDiagnosisEvidence(runId: string, evidence?: string | null) {
  const tag = `[compliance-run:${runId}]`;
  if (!evidence) return tag;
  return evidence.includes(tag) ? evidence : `${tag} ${evidence}`;
}

export async function filterNewComplianceDiagnosis(
  projectId: string,
  items: Omit<DiagnosisItem, "id" | "projectId" | "createdAt" | "updatedAt">[]
) {
  const project = await getProjectById(projectId);
  const existingTitles = new Set(
    (project?.diagnosis ?? []).map((d) => d.title.trim().toLowerCase())
  );

  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.title.trim().toLowerCase();
    if (existingTitles.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function saveComplianceRun(
  input: SaveComplianceRunInput
): Promise<ComplianceCheckRunDto> {
  if (await shouldUseDatabase()) {
    return db.createDbComplianceRun(input);
  }
  return createMemoryRun(input);
}

export async function getComplianceRun(runId: string): Promise<ComplianceCheckRunDto | null> {
  if (await shouldUseDatabase()) {
    return db.getDbComplianceRun(runId);
  }
  return memoryRuns.find((r) => r.id === runId) ?? null;
}

export async function listComplianceRuns(
  projectId: string,
  limit = 10
): Promise<ComplianceCheckRunDto[]> {
  if (await shouldUseDatabase()) {
    return db.listDbComplianceRuns(projectId, limit);
  }
  return memoryRuns.filter((r) => r.projectId === projectId).slice(0, limit);
}

export async function applyComplianceDiagnosis(
  projectId: string,
  runId: string,
  items: Omit<DiagnosisItem, "id" | "projectId" | "createdAt" | "updatedAt">[]
): Promise<ApplyComplianceDiagnosisResult> {
  const newItems = await filterNewComplianceDiagnosis(projectId, items);
  const skipped = items.length - newItems.length;

  const tagged = newItems.map((item) => ({
    ...item,
    evidence: tagDiagnosisEvidence(runId, item.evidence),
  }));

  const created = tagged.length > 0 ? await addDiagnosisItems(projectId, tagged) : [];

  if (await shouldUseDatabase()) {
    await db.markDbComplianceRunDiagnosisApplied(runId, created.length);
  } else {
    const run = memoryRuns.find((r) => r.id === runId);
    if (run) {
      run.diagnosisApplied = true;
      run.diagnosisCount = created.length;
    }
  }

  return {
    created,
    skipped,
    diagnosisCount: created.length,
  };
}

export async function persistComplianceResult(input: {
  projectId: string;
  report: SaveComplianceRunInput["report"];
  measurements?: SaveComplianceRunInput["measurements"];
  diagnosisDrafts?: Omit<DiagnosisItem, "id" | "projectId" | "createdAt" | "updatedAt">[];
  applyDiagnosis?: boolean;
}): Promise<PersistComplianceResult> {
  const run = await saveComplianceRun({
    projectId: input.projectId,
    report: input.report,
    measurements: input.measurements,
  });

  if (!input.applyDiagnosis || !input.diagnosisDrafts?.length) {
    return { run };
  }

  const diagnosis = await applyComplianceDiagnosis(
    input.projectId,
    run.id,
    input.diagnosisDrafts
  );

  const updatedRun = (await getComplianceRun(run.id)) ?? {
    ...run,
    diagnosisApplied: true,
    diagnosisCount: diagnosis.diagnosisCount,
  };

  return { run: updatedRun, diagnosis };
}
