import { after, NextResponse } from "next/server";
import { getProjectById } from "@/lib/db/repository";
import { runDocumentIngestWorkflow } from "@/lib/ai/workflow";
import { createDocumentAnalysisTask } from "@/lib/ai/tasks/document-analysis-tasks";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string; docId: string }> }
) {
  const { projectId, docId } = await params;
  const project = await getProjectById(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const language = body.language === "zh" ? "zh" : body.language === "en" ? "en" : "auto";
  const createIssues = body.createIssues !== false;
  const refreshBuildingMemory = body.refreshBuildingMemory !== false;
  const asyncMode = body.async === true;

  if (asyncMode) {
    const doc = project.documents?.find((d) => d.id === docId);
    const task = createDocumentAnalysisTask({
      projectId,
      documentId: docId,
      documentName: doc?.name ?? docId,
    });

    after(async () => {
      await runDocumentIngestWorkflow(projectId, docId, {
        language,
        createIssues,
        refreshBuildingMemory,
        taskId: task.id,
      });
    });

    return NextResponse.json({
      analysisTaskId: task.id,
      statusUrl: `/api/projects/${projectId}/analysis-tasks/${task.id}`,
      message: "Analysis queued",
    });
  }

  const result = await runDocumentIngestWorkflow(projectId, docId, {
    language,
    createIssues,
    refreshBuildingMemory,
  });

  if (!result) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  return NextResponse.json({
    document: result.document,
    analysis: result.analysis,
    evidence: result.evidence,
    issuesCreated: result.issuesCreated,
    analysisRun: result.analysisRun,
    buildingMemory: result.buildingMemory,
  });
}
