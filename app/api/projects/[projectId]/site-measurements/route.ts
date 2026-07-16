import { NextResponse } from "next/server";
import { guardOrRespond } from "@/lib/auth/api-guard";
import { requireProjectAccess } from "@/lib/auth/authorize";
import { parseMeasurementsFromBody } from "@/lib/ai/compliance/measurements";
import {
  getProjectSiteMeasurements,
  updateProjectSiteMeasurements,
} from "@/lib/db/site-measurements-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;

  const record = await getProjectSiteMeasurements(projectId);
  return NextResponse.json(record);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;

  const denied = await guardOrRespond("PATCH", "/api/projects/*/site-measurements");
  if (denied) return denied;

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const measurements = parseMeasurementsFromBody(body);
  const notes = body.notes !== undefined ? String(body.notes ?? "") || null : undefined;
  const replace = body.replace !== false;

  const record = await updateProjectSiteMeasurements(
    projectId,
    { measurements, notes },
    { replace }
  );

  return NextResponse.json(record);
}
