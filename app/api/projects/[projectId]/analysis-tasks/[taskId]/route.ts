import { NextResponse } from "next/server";
import { getProjectById } from "@/lib/db/repository";
import { getDocumentAnalysisTask } from "@/lib/ai/tasks/document-analysis-tasks";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; taskId: string }> }
) {
  const { projectId, taskId } = await params;
  const project = await getProjectById(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const task = getDocumentAnalysisTask(taskId);
  if (!task || task.projectId !== projectId) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({ task });
}
