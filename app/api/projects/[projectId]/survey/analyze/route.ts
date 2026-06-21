import { NextResponse } from "next/server";
import {
  getProjectById,
  updateDocument,
  addSourceEvidence,
  addAnalysisRun,
  addIssue,
} from "@/lib/db/repository";
import { analyzeProjectDocuments } from "@/lib/ai/document-analysis-pipeline";
import { detectMissingInformation, generateSurveyTaskList } from "@/lib/ai/agents/survey-agent";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const project = await getProjectById(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const docs = project.documents ?? [];
  const unanalyzed = docs.filter((d) => !d.aiSummary);

  const results = await analyzeProjectDocuments(project, {
    language: "auto",
    includeOCR: true,
    extractTables: true,
    detectDefects: true,
  });

  let evidenceCount = 0;
  let issuesCount = 0;

  for (const result of results) {
    if (!unanalyzed.some((d) => d.id === result.documentId) && docs.find((d) => d.id === result.documentId)?.aiSummary) {
      continue;
    }

    await updateDocument(result.documentId, {
      aiSummary: result.aiSummary,
      extractedText: result.extractedText,
    });

    for (const ev of result.evidence) {
      await addSourceEvidence(ev);
      evidenceCount++;
    }

    for (const issue of result.suggestedIssues ?? []) {
      await addIssue(projectId, {
        title: issue.title,
        category: issue.category,
        priority: issue.priority,
        status: "open",
        location: issue.location ?? null,
        description: issue.description,
        photoUrl: docs.find((d) => d.id === result.documentId)?.fileUrl ?? null,
        assignedToId: null,
        aiDetected: true,
      });
      issuesCount++;
    }
  }

  const updatedProject = await getProjectById(projectId);
  const missing = await detectMissingInformation(updatedProject!);
  const tasks = await generateSurveyTaskList(updatedProject!);

  const summaries = (updatedProject?.documents ?? []).map((doc) => ({
    documentId: doc.id,
    category: doc.category,
    aiSummary: doc.aiSummary ?? `Pending analysis for ${doc.name}`,
    confidence: results.find((r) => r.documentId === doc.id)?.confidence ?? 0.82,
  }));

  const analysisRun = await addAnalysisRun({
    projectId,
    analysisType: "document_analysis",
    inputSummary: `Batch analysis of ${docs.length} documents (${unanalyzed.length} newly analyzed)`,
    outputSummary: `Generated ${summaries.length} summaries, ${evidenceCount} evidence items, ${issuesCount} site issues`,
    generatedItemCount: summaries.length + evidenceCount + issuesCount,
    modelName: results[0]?.modelName ?? "vision-pipeline",
    confidence: results.reduce((s, r) => s + r.confidence, 0) / Math.max(results.length, 1),
  });

  return NextResponse.json({
    summaries,
    missingInsights: missing,
    surveyTasks: tasks,
    analysisRun,
    stats: {
      documentsAnalyzed: results.length,
      evidenceCreated: evidenceCount,
      issuesCreated: issuesCount,
    },
  });
}
