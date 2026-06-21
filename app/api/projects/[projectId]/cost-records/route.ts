import { NextResponse } from "next/server";
import { getProjectById, listProjectCostRecords, createProjectCostRecord } from "@/lib/db/repository";
import { projectCostRecordSchema } from "@/lib/validators/project-cost-record";
import { requireSession } from "@/lib/auth/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const project = await getProjectById(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const records = await listProjectCostRecords(projectId);
  return NextResponse.json({ records, projectStatus: project.status });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    await requireSession();
    const { projectId } = await params;
    const body = await request.json();
    const parsed = projectCostRecordSchema.parse(body);

    const { record, calibration } = await createProjectCostRecord(
      projectId,
      {
        strategyType: parsed.strategyType,
        actualCostPerSqm: parsed.actualCostPerSqm,
        actualTotalCost: parsed.actualTotalCost,
        durationMonths: parsed.durationMonths,
        outcome: parsed.outcome,
        notes: parsed.notes,
      },
      { markCompleted: parsed.markCompleted }
    );

    return NextResponse.json({ record, calibration }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    const status = message === "Unauthorized" ? 401 : message === "Project not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
