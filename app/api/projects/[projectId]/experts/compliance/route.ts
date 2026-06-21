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

  const report = await platform.compliance.performComplianceCheck(project, {
    ceilingHeight: body.ceilingHeight,
    stairWidth: body.stairWidth,
    fireCompartmentArea: body.fireCompartmentArea,
    hasAccessibleEntrance: body.hasAccessibleEntrance,
    windowUValue: body.windowUValue,
  });

  const diagnosisItems = await platform.compliance.generateComplianceDiagnosis(project);

  return NextResponse.json({
    report,
    diagnosisItems,
  });
}
