import { NextResponse } from "next/server";
import {
  getProjectById,
  getDocumentById,
  updateDocument,
  addSourceEvidence,
  addAnalysisRun,
  addIssue,
} from "@/lib/db/repository";
import { analyzeDocumentAsset } from "@/lib/ai/document-analysis-pipeline";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string; docId: string }> }
) {
  const { projectId, docId } = await params;
  const project = await getProjectById(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const doc = await getDocumentById(docId);
  if (!doc || doc.projectId !== projectId) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const language = body.language === "zh" ? "zh" : body.language === "en" ? "en" : "auto";
  const createIssues = body.createIssues !== false;

  const buildingAge = project.constructionYear
    ? new Date().getFullYear() - project.constructionYear
    : undefined;

  const result = await analyzeDocumentAsset(
    projectId,
    doc,
    { language, includeOCR: true, extractTables: true, detectDefects: true },
    buildingAge
  );

  const updated = await updateDocument(docId, {
    aiSummary: result.aiSummary,
    extractedText: result.extractedText,
  });

  const evidenceRecords = [];
  for (const ev of result.evidence) {
    evidenceRecords.push(await addSourceEvidence(ev));
  }

  const issuesCreated = [];
  if (createIssues && result.suggestedIssues) {
    for (const issue of result.suggestedIssues) {
      const created = await addIssue(projectId, {
        title: issue.title,
        category: issue.category,
        priority: issue.priority,
        status: "open",
        location: issue.location ?? null,
        description: issue.description,
        photoUrl: doc.fileUrl,
        assignedToId: null,
        aiDetected: true,
      });
      issuesCreated.push(created);
    }
  }

  const analysisRun = await addAnalysisRun({
    projectId,
    analysisType: "document_analysis",
    inputSummary: `Analyzed document: ${doc.name} (${result.kind})`,
    outputSummary: result.aiSummary.slice(0, 500),
    generatedItemCount: evidenceRecords.length + issuesCreated.length,
    modelName: result.modelName,
    confidence: result.confidence,
  });

  return NextResponse.json({
    document: updated,
    analysis: result,
    evidence: evidenceRecords,
    issuesCreated,
    analysisRun,
  });
}
