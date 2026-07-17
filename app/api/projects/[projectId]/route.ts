import { NextResponse } from "next/server";
import { z } from "zod";
import { requireProjectAccess } from "@/lib/auth/authorize";
import { guardOrRespond } from "@/lib/auth/api-guard";
import { deleteProjectPermanently } from "@/lib/db/project-lifecycle-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;
  return NextResponse.json(access.project);
}

const deleteBodySchema = z.object({
  confirmCode: z.string().min(1),
});

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;

  const denied = await guardOrRespond("DELETE", "/api/projects/*");
  if (denied) return denied;

  const body = deleteBodySchema.parse(await request.json().catch(() => ({})));

  try {
    const audit = await deleteProjectPermanently({
      projectId,
      organizationId: access.user.organizationId,
      performedById: access.user.id,
      performedByName: access.user.name,
      confirmCode: body.confirmCode,
    });

    if (!audit) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, audit });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed" },
      { status: 400 }
    );
  }
}
