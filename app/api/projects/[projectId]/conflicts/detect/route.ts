import { NextResponse } from "next/server";
import { getProjectById } from "@/lib/db/repository";
import { runConflictDetectionWorkflow } from "@/lib/ai/workflow/conflict-workflow";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const project = await getProjectById(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const result = await runConflictDetectionWorkflow(projectId, {
    refreshBuildingMemory: true,
    persistInsights: true,
  });

  if (!result) {
    return NextResponse.json({ error: "Conflict detection failed" }, { status: 500 });
  }

  return NextResponse.json(result);
}
