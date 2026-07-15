import { NextResponse } from "next/server";
import { deleteDocument, getDocumentById } from "@/lib/db/repository";
import { requireProjectAccess } from "@/lib/auth/authorize";
import { guardOrRespond } from "@/lib/auth/api-guard";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; docId: string }> }
) {
  const { projectId, docId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;

  const denied = await guardOrRespond("DELETE", "/api/projects/*/documents/*");
  if (denied) return denied;

  const doc = await getDocumentById(docId);
  if (!doc || doc.projectId !== projectId) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const ok = await deleteDocument(docId);
  if (!ok) {
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
