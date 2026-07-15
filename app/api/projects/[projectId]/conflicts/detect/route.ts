import { NextResponse } from "next/server";
import { runConflictDetectionWorkflow } from "@/lib/ai/workflow/conflict-workflow";
import { requireProjectAccess } from "@/lib/auth/authorize";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;

  const result = await runConflictDetectionWorkflow(projectId, access.user.organizationId, {
    refreshBuildingMemory: true,
    persistInsights: true,
  });

  if (!result) {
    return NextResponse.json({ error: "Conflict detection failed" }, { status: 500 });
  }

  return NextResponse.json(result);
}
