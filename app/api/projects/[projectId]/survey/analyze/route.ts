import { NextResponse } from "next/server";
import { getProjectById } from "@/lib/db/repository";
import { getAIPlatform } from "@/lib/ai";
import { generateId } from "@/lib/mock-data";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const project = await getProjectById(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const platform = getAIPlatform();
  const summaries = await platform.survey.analyzeUploadedDocuments(project);
  const missing = await platform.survey.detectMissingInformation(project);
  const tasks = await platform.survey.generateSurveyTaskList(project);

  return NextResponse.json({
    summaries,
    missingInsights: missing,
    surveyTasks: tasks,
    analysisRun: {
      id: generateId("run"),
      analysisType: "document_analysis",
      generatedItemCount: summaries.length + missing.length,
    },
  });
}
