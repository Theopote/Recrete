import { NextResponse } from "next/server";
import { getProjectById } from "@/lib/db/repository";
import { getAIPlatform } from "@/lib/ai";
import { guardOrRespond } from "@/lib/auth/api-guard";
import {
  runComplianceEngine,
  getApplicableCodesForProject,
  getScenariosForProject,
  type ComplianceMeasurements,
} from "@/lib/ai/compliance";
import { listComplianceRuns, persistComplianceResult } from "@/lib/db/compliance-store";

function parseMeasurements(body: Record<string, unknown>): ComplianceMeasurements {
  return {
    ceilingHeight: body.ceilingHeight != null ? Number(body.ceilingHeight) : undefined,
    stairWidth: body.stairWidth != null ? Number(body.stairWidth) : undefined,
    fireCompartmentArea:
      body.fireCompartmentArea != null ? Number(body.fireCompartmentArea) : undefined,
    hasAccessibleEntrance:
      body.hasAccessibleEntrance != null ? Boolean(body.hasAccessibleEntrance) : undefined,
    windowUValue: body.windowUValue != null ? Number(body.windowUValue) : undefined,
    carbonationDepth:
      body.carbonationDepth != null ? Number(body.carbonationDepth) : undefined,
    coverThickness: body.coverThickness != null ? Number(body.coverThickness) : undefined,
    existingLoadKN: body.existingLoadKN != null ? Number(body.existingLoadKN) : undefined,
    targetLoadKN: body.targetLoadKN != null ? Number(body.targetLoadKN) : undefined,
    travelDistance: body.travelDistance != null ? Number(body.travelDistance) : undefined,
    hasSprinkler: body.hasSprinkler != null ? Boolean(body.hasSprinkler) : undefined,
  };
}

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
  const project = await getProjectById(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

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
  const denied = await guardOrRespond("POST", "/api/projects/*/compliance");
  if (denied) return denied;

  const { projectId } = await params;
  const project = await getProjectById(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const measurements = parseMeasurements(body);
  const applyDiagnosis = parseApplyDiagnosis(body);

  const platform = getAIPlatform();
  const report = runComplianceEngine(project, { measurements });
  const diagnosisDrafts = await platform.compliance.generateComplianceDiagnosis(
    project,
    measurements
  );

  const persisted = await persistComplianceResult({
    projectId,
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
