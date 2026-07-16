import { NextResponse } from "next/server";
import { addDocument } from "@/lib/db/repository";
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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;

  const denied = await guardOrRespond("POST", "/api/projects/*/documents");
  if (denied) return denied;

  const userId = await getCurrentUserId();
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const saved = await saveUploadedFile(projectId, file);
    const category = (formData.get("category") as string) ?? "others";

    const doc = await addDocument(projectId, {
      name: saved.name,
      type: saved.type,
      fileUrl: saved.fileUrl,
      fileSize: saved.fileSize,
      mimeType: saved.mimeType,
      category: category as import("@/types").DocumentCategory,
      description: (formData.get("description") as string) ?? null,
      uploadedById: userId ?? "user-1",
    });

    const autoAnalyze = formData.get("autoAnalyze") !== "false";
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

  const body = await request.json();
  const doc = await addDocument(projectId, {
    name: body.name,
    type: body.name.split(".").pop() ?? "file",
    fileUrl: body.fileUrl ?? `/uploads/${projectId}/${body.name}`,
    fileSize: body.fileSize ?? 0,
    mimeType: body.mimeType ?? "application/octet-stream",
    category: body.category ?? "others",
    description: body.description ?? null,
    uploadedById: userId ?? "user-1",
  });

  const autoAnalyze = body.autoAnalyze !== false;
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
