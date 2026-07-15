import { NextResponse } from "next/server";
import { getProjectById } from "@/lib/db/repository";
import { getCurrentUserId } from "@/lib/auth/session";
import { listBimModels } from "@/lib/bim/bim-model-repository";
import { createBimModelFromUpload } from "@/lib/bim/process-model-upload";
import { guardOrRespond } from "@/lib/auth/api-guard";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const project = await getProjectById(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const models = await listBimModels(projectId);
  return NextResponse.json({ models });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const denied = await guardOrRespond("POST", "/api/projects/*/bim-models");
  if (denied) return denied;

  const { projectId } = await params;
  const project = await getProjectById(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const userId = await getCurrentUserId();
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  try {
    const model = await createBimModelFromUpload({
      projectId,
      file,
      uploadedById: userId ?? "user-1",
    });
    return NextResponse.json(model);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 }
    );
  }
}
