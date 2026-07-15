import { NextResponse } from "next/server";
import { listProjectCostRecords, createProjectCostRecord } from "@/lib/db/repository";
import { projectCostRecordSchema } from "@/lib/validators/project-cost-record";
import { requireProjectAccess } from "@/lib/auth/authorize";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;
  const { project } = access;

  const records = await listProjectCostRecords(projectId);
  return NextResponse.json({ records, projectStatus: project.status });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const access = await requireProjectAccess(projectId);
    if ("error" in access) return access.error;

    const body = await request.json();
    const parsed = projectCostRecordSchema.parse(body);

    const { record, calibration } = await createProjectCostRecord(
      projectId,
      access.user.organizationId,
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
    const status = message === "Project not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
