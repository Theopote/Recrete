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

  const analysis = platform.fire.analyzeFireSafety(project, {
    occupantLoad: body.occupantLoad,
    stairWidth: body.stairWidth,
    travelDistance: body.travelDistance,
    floorArea: body.floorArea,
    hasSprinkler: body.hasSprinkler,
  });

  const diagnosisItems = await platform.fire.generateFireDiagnosis(project);

  return NextResponse.json({ analysis, diagnosisItems });
}
