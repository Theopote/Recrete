import { NextResponse } from "next/server";
import { updateProjectCostRecord, deleteProjectCostRecord } from "@/lib/db/repository";
import { projectCostRecordUpdateSchema } from "@/lib/validators/project-cost-record";
import { requireProjectAccess } from "@/lib/auth/authorize";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ projectId: string; recordId: string }> }
) {
  const { projectId, recordId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;

  try {
    const body = await request.json();
    const parsed = projectCostRecordUpdateSchema.parse(body);
    const { record, calibration } = await updateProjectCostRecord(recordId, parsed);
    if (!record) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ record, calibration });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; recordId: string }> }
) {
  const { projectId, recordId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;

  try {
    const { ok, calibration } = await deleteProjectCostRecord(recordId);
    if (!ok) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, calibration });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
