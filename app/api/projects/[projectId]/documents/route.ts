import { after, NextResponse } from "next/server";
import { getProjectById, addDocument } from "@/lib/db/repository";
import { getCurrentUserId } from "@/lib/auth/session";
import { saveUploadedFile } from "@/lib/storage/upload";
import { runDocumentIngestWorkflow } from "@/lib/ai/workflow";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const project = await getProjectById(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

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
    if (autoAnalyze) {
      after(async () => {
        await runDocumentIngestWorkflow(projectId, doc.id);
      });
    }

    return NextResponse.json({ ...doc, autoAnalysisQueued: autoAnalyze });
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
  if (autoAnalyze) {
    after(async () => {
      await runDocumentIngestWorkflow(projectId, doc.id);
    });
  }

  return NextResponse.json({ ...doc, autoAnalysisQueued: autoAnalyze });
}
