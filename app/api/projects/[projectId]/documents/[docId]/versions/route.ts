import { NextResponse } from "next/server";
import {
  addDocumentVersion,
  getDocumentById,
  getDocumentVersions,
} from "@/lib/db/repository";
import { requireProjectAccess } from "@/lib/auth/authorize";
import { getCurrentUserId } from "@/lib/auth/session";
import { saveUploadedFile } from "@/lib/storage/upload";
import { createDocumentAnalysisTask } from "@/lib/ai/tasks/document-analysis-tasks";
import { enqueueDocumentIngestJob } from "@/lib/jobs/enqueue";
import { guardOrRespond } from "@/lib/auth/api-guard";
import {
  shouldOpenBuildingCondition,
  syncDocumentCadToBimModel,
} from "@/lib/building-condition/unified-cad-sync";
import { parseDocumentUploadMetadata } from "@/lib/documents/parse-upload-metadata";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; docId: string }> }
) {
  const { projectId, docId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;

  const doc = await getDocumentById(docId);
  if (!doc || doc.projectId !== projectId) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const versions = await getDocumentVersions(docId);
  return NextResponse.json({ current: doc, versions });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string; docId: string }> }
) {
  const { projectId, docId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;

  const denied = await guardOrRespond("POST", "/api/projects/*/documents/*/versions");
  if (denied) return denied;

  const base = await getDocumentById(docId);
  if (!base || base.projectId !== projectId) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const userId = await getCurrentUserId();
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const meta = parseDocumentUploadMetadata(formData);
  const saved = await saveUploadedFile(projectId, file);

  const doc = await addDocumentVersion(projectId, docId, {
    name: saved.name,
    type: saved.type,
    fileUrl: saved.fileUrl,
    fileSize: saved.fileSize,
    mimeType: saved.mimeType,
    category: meta.category ?? base.category,
    description: meta.description ?? base.description ?? null,
    tags: meta.tags ?? base.tags ?? [],
    projectPhase: meta.projectPhase ?? base.projectPhase ?? "general",
    uploadedById: userId ?? "user-1",
  });

  if (!doc) {
    return NextResponse.json({ error: "Failed to create document version" }, { status: 500 });
  }

  const autoAnalyze = meta.autoAnalyze !== false;
  let analysisTaskId: string | undefined;
  if (autoAnalyze) {
    const task = await createDocumentAnalysisTask({
      projectId,
      documentId: doc.id,
      documentName: doc.name,
    });
    analysisTaskId = task.id;
    await enqueueDocumentIngestJob({
      projectId,
      organizationId: access.user.organizationId,
      documentId: doc.id,
      taskId: task.id,
    });
  }

  const bimLink = await syncDocumentCadToBimModel({
    projectId,
    document: doc,
    uploadedById: userId ?? "user-1",
  });

  return NextResponse.json({
    ...doc,
    autoAnalysisQueued: autoAnalyze,
    analysisTaskId,
    bimModelId: bimLink?.modelId,
    openBuildingCondition: shouldOpenBuildingCondition(doc.name, doc.category),
  });
}
