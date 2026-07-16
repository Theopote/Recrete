import { NextResponse } from "next/server";
import { updateBuildingMemory } from "@/lib/db/repository";
import { requireProjectAccess } from "@/lib/auth/authorize";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;

  const memory = await updateBuildingMemory(projectId, access.user.organizationId, "manual");
  if (!memory) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  return NextResponse.json({ memory });
}
