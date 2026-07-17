import { NextResponse } from "next/server";
import { z } from "zod";
import { requireProjectAccess } from "@/lib/auth/authorize";
import { guardOrRespond } from "@/lib/auth/api-guard";
import { archiveProject } from "@/lib/db/project-lifecycle-store";

const bodySchema = z.object({
  reason: z.string().max(500).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;

  const denied = await guardOrRespond("POST", "/api/projects/*/archive");
  if (denied) return denied;

  const body = bodySchema.parse(await request.json().catch(() => ({})));

  try {
    const result = await archiveProject({
      projectId,
      organizationId: access.user.organizationId,
      performedById: access.user.id,
      performedByName: access.user.name,
      reason: body.reason,
    });

    if (!result) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Archive failed" },
      { status: 400 }
    );
  }
}
