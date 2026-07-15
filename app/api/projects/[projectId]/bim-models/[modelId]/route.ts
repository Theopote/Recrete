import { NextResponse } from "next/server";
import { deleteBimModel, getBimModel } from "@/lib/bim/bim-model-repository";
import { requireProjectAccess } from "@/lib/auth/authorize";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; modelId: string }> }
) {
  const { projectId, modelId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;

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
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;

  const deleted = await deleteBimModel(projectId, modelId);
  if (!deleted) {
    return NextResponse.json({ error: "Model not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
