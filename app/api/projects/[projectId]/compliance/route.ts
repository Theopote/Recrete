import { NextResponse } from "next/server";
import { getAIPlatform } from "@/lib/ai";
import { guardOrRespond } from "@/lib/auth/api-guard";
import { requireProjectAccess } from "@/lib/auth/authorize";
import {
  runComplianceEngine,
  getApplicableCodesForProject,
  getScenariosForProject,
} from "@/lib/ai/compliance";
import { parseMeasurementsFromBody } from "@/lib/ai/compliance/measurements";
import { listComplianceRuns, persistComplianceResult } from "@/lib/db/compliance-store";
import { resolveProjectMeasurements } from "@/lib/db/site-measurements-store";

function parseApplyDiagnosis(body: Record<string, unknown>) {
  if (body.applyDiagnosis === false) return false;
  if (body.applyDiagnosis === true) return true;
  return true;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;
  const { project } = access;

  const url = new URL(request.url);
  const historyLimit = Number(url.searchParams.get("history") ?? "0");

  const payload: Record<string, unknown> = {
    scenarios: getScenariosForProject(project),
    applicableCodes: getApplicableCodesForProject(project).map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      nameZh: c.nameZh,
      category: c.category,
    })),
  };

  if (historyLimit > 0) {
    payload.history = await listComplianceRuns(projectId, Math.min(historyLimit, 50));
  }

  return NextResponse.json(payload);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;
  const { project, user } = access;

  const denied = await guardOrRespond("POST", "/api/projects/*/compliance");
  if (denied) return denied;

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const overrides = parseMeasurementsFromBody(body);
  const measurements = await resolveProjectMeasurements(projectId, overrides);
  const applyDiagnosis = parseApplyDiagnosis(body);

  const platform = getAIPlatform();
  const report = runComplianceEngine(project, { measurements });
  const diagnosisDrafts = await platform.compliance.generateComplianceDiagnosis(
    project,
    measurements
  );

  const persisted = await persistComplianceResult({
    projectId,
    organizationId: user.organizationId,
    report,
    measurements,
    diagnosisDrafts,
    applyDiagnosis,
  });

  return NextResponse.json({
    report,
    run: persisted.run,
    diagnosisItems: persisted.diagnosis?.created ?? diagnosisDrafts,
    diagnosisApplied: Boolean(persisted.diagnosis),
    diagnosisStats: persisted.diagnosis
      ? {
          created: persisted.diagnosis.diagnosisCount,
          skipped: persisted.diagnosis.skipped,
        }
      : null,
  });
}
