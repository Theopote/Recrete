import { NextResponse } from "next/server";
import { getProjectById } from "@/lib/db/repository";
import { deleteBimModel, getBimModel } from "@/lib/bim/bim-model-repository";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; modelId: string }> }
) {
  const { projectId, modelId } = await params;
  const project = await getProjectById(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const model = await getBimModel(projectId, modelId);
  if (!model) {
    return NextResponse.json({ error: "Model not found" }, { status: 404 });
  }

  return NextResponse.json(model);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; modelId: string }> }
) {
  const { projectId, modelId } = await params;
  const project = await getProjectById(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const deleted = await deleteBimModel(projectId, modelId);
  if (!deleted) {
    return NextResponse.json({ error: "Model not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
