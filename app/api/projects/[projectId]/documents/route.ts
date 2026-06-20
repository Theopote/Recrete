import { NextResponse } from "next/server";
import { getProjectById, addDocument } from "@/lib/db/repository";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const project = await getProjectById(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = await request.json();
  const doc = await addDocument(projectId, {
    name: body.name,
    type: body.name.split(".").pop() ?? "file",
    fileUrl: `/uploads/${projectId}/${body.name}`,
    fileSize: body.fileSize ?? 0,
    mimeType: body.mimeType ?? "application/octet-stream",
    category: body.category ?? "others",
    description: body.description ?? null,
    uploadedById: "user-1",
  });

  return NextResponse.json(doc);
}
