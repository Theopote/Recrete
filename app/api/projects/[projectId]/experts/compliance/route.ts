import { NextResponse } from "next/server";
import { getProjectById } from "@/lib/db/repository";
import { getAIPlatform } from "@/lib/ai";
import { guardOrRespond } from "@/lib/auth/api-guard";
import { runComplianceEngine, type ComplianceMeasurements } from "@/lib/ai/compliance";
import { persistComplianceResult } from "@/lib/db/compliance-store";

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
    existingLoadKN: body.existingLoadKN != null ? Number(body.existingLoadKN) : undefined,
    travelDistance: body.travelDistance != null ? Number(body.travelDistance) : undefined,
    hasSprinkler: body.hasSprinkler != null ? Boolean(body.hasSprinkler) : undefined,
  };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const denied = await guardOrRespond("POST", "/api/projects/*/experts/compliance");
  if (denied) return denied;

  const { projectId } = await params;
  const project = await getProjectById(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const measurements = parseMeasurements(body);
  const applyDiagnosis = body.applyDiagnosis !== false;

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
