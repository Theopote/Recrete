import { NextResponse } from "next/server";
import { guardOrRespond } from "@/lib/auth/api-guard";
import { requireProjectAccess } from "@/lib/auth/authorize";
import { syncMeasurementsFromDrawings } from "@/lib/building-condition/sync-drawing-measurements";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;

  const denied = await guardOrRespond(
    "POST",
    "/api/projects/*/site-measurements/extract-from-drawings"
  );
  if (denied) return denied;

  const { extraction, record } = await syncMeasurementsFromDrawings(projectId);

  return NextResponse.json({
    record,
    extraction,
    appliedFields: Object.keys(extraction.measurements),
  });
}
