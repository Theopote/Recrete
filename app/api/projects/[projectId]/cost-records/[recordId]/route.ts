import { NextResponse } from "next/server";
import { updateProjectCostRecord, deleteProjectCostRecord } from "@/lib/db/repository";
import { projectCostRecordUpdateSchema } from "@/lib/validators/project-cost-record";
import { requireSession } from "@/lib/auth/session";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ projectId: string; recordId: string }> }
) {
  try {
    await requireSession();
    const { recordId } = await params;
    const body = await request.json();
    const parsed = projectCostRecordUpdateSchema.parse(body);
    const { record, calibration } = await updateProjectCostRecord(recordId, parsed);
    if (!record) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ record, calibration });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; recordId: string }> }
) {
  try {
    await requireSession();
    const { recordId } = await params;
    const { ok, calibration } = await deleteProjectCostRecord(recordId);
    if (!ok) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, calibration });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
