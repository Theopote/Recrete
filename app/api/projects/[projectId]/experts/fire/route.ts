import { NextResponse } from "next/server";
import { getProjectById } from "@/lib/db/repository";
import { getAIPlatform } from "@/lib/ai";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const project = await getProjectById(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

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
