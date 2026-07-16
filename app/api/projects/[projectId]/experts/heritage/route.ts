import { NextResponse } from "next/server";
import { requireProjectAccess } from "@/lib/auth/authorize";
import { getAIPlatform } from "@/lib/ai";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;
  const { project } = access;

  const body = await request.json().catch(() => ({}));
  const platform = getAIPlatform();

  const assessment = platform.heritage.assessHeritageProject(project, {
    hasProtectedFacade: body.hasProtectedFacade,
    hasHistoricInterior: body.hasHistoricInterior,
    interventionScope: body.interventionScope,
  });

  const diagnosisItems = await platform.heritage.generateHeritageDiagnosis(project);

  return NextResponse.json({ assessment, diagnosisItems });
}
