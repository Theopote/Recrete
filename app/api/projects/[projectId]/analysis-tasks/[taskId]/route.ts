import { NextResponse } from "next/server";
import { getDocumentAnalysisTask } from "@/lib/ai/tasks/document-analysis-tasks";
import { requireProjectAccess } from "@/lib/auth/authorize";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; taskId: string }> }
) {
  const { projectId, taskId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;

  const task = await getDocumentAnalysisTask(taskId);
  if (!task || task.projectId !== projectId) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({ task });
}
