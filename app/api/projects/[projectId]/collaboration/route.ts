import { NextResponse } from "next/server";
import { getCollaborationSummary } from "@/lib/db/collaboration-store";
import { requireProjectAccess } from "@/lib/auth/authorize";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;

  const summary = await getCollaborationSummary(projectId);
  return NextResponse.json(summary);
}
