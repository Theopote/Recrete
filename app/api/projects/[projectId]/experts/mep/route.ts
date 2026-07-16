import { NextResponse } from "next/server";
import { requireProjectAccess } from "@/lib/auth/authorize";
import { getAIPlatform } from "@/lib/ai";
import type { MepAnalysisInput, MepClashInput } from "@/lib/ai/agents/mep-agent";
import { persistMepClashIssues } from "@/lib/db/mep-clash-store";
import type { AppLocale } from "@/lib/i18n/locale";

function parseMepBody(body: Record<string, unknown>): MepAnalysisInput & MepClashInput {
  return {
    electricalCapacityKva:
      body.electricalCapacityKva != null ? Number(body.electricalCapacityKva) : undefined,
    hvacAgeYears: body.hvacAgeYears != null ? Number(body.hvacAgeYears) : undefined,
    plumbingCondition:
      body.plumbingCondition === "good" ||
      body.plumbingCondition === "fair" ||
      body.plumbingCondition === "poor"
        ? body.plumbingCondition
        : undefined,
    requiredElectricalKva:
      body.requiredElectricalKva != null ? Number(body.requiredElectricalKva) : undefined,
    shaftWidthMm: body.shaftWidthMm != null ? Number(body.shaftWidthMm) : undefined,
    shaftDepthMm: body.shaftDepthMm != null ? Number(body.shaftDepthMm) : undefined,
    floorToFloorHeightM:
      body.floorToFloorHeightM != null ? Number(body.floorToFloorHeightM) : undefined,
    ceilingPlenumMm: body.ceilingPlenumMm != null ? Number(body.ceilingPlenumMm) : undefined,
    mainBeamDepthMm: body.mainBeamDepthMm != null ? Number(body.mainBeamDepthMm) : undefined,
    hvacMainDuctWidthMm:
      body.hvacMainDuctWidthMm != null ? Number(body.hvacMainDuctWidthMm) : undefined,
    riserCount: body.riserCount != null ? Number(body.riserCount) : undefined,
  };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;
  const { project } = access;

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const input = parseMepBody(body);
  const createIssues = body.createIssues !== false;
  const locale = body.locale === "en" ? "en" : ("zh" as AppLocale);
  const platform = getAIPlatform();

  const analysis = platform.mep.assessMepCapacity(project, input);
  const clashReport = platform.mep.detectPipelineClashes(project, input);
  const diagnosisItems = await platform.mep.generateMepDiagnosis(project);

  const issueResult = createIssues
    ? await persistMepClashIssues({
        projectId,
        clashes: clashReport.clashes,
        existingIssues: project.issues ?? [],
        locale,
      })
    : { created: [], skipped: 0 };

  return NextResponse.json({
    analysis,
    clashReport,
    diagnosisItems,
    issuesCreated: issueResult.created,
    issueStats: {
      created: issueResult.created.length,
      skipped: issueResult.skipped,
    },
  });
}
