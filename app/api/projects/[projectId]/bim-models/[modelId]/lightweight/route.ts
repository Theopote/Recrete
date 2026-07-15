import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import {
  buildMetadata,
  getBimModel,
  updateBimModel,
} from "@/lib/bim/bim-model-repository";
import { requireProjectAccess } from "@/lib/auth/authorize";
import type { BimModelMetadata } from "@/types/bim";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string; modelId: string }> }
) {
  const { projectId, modelId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;

  const model = await getBimModel(projectId, modelId);
  if (!model) {
    return NextResponse.json({ error: "Model not found" }, { status: 404 });
  }

  if (model.format !== "ifc") {
    return NextResponse.json({ error: "Only IFC models support lightweight conversion" }, { status: 400 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json()) as { failed?: boolean; errorMessage?: string };
    if (body.failed) {
      const updated = await updateBimModel(projectId, modelId, {
        status: "failed",
        errorMessage: body.errorMessage ?? "IFC lightweight conversion failed",
      });
      return NextResponse.json(updated);
    }
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const formData = await request.formData();
  const glb = formData.get("glb");
  const metadataRaw = formData.get("metadata");

  if (!(glb instanceof File)) {
    return NextResponse.json({ error: "GLB file is required" }, { status: 400 });
  }

  let metadata: BimModelMetadata = {};
  if (typeof metadataRaw === "string") {
    try {
      metadata = JSON.parse(metadataRaw) as BimModelMetadata;
    } catch {
      return NextResponse.json({ error: "Invalid metadata JSON" }, { status: 400 });
    }
  }

  const previewDir = path.join(process.cwd(), "public", "uploads", projectId, "bim-previews");
  await mkdir(previewDir, { recursive: true });
  const previewName = `${modelId}.glb`;
  const buffer = Buffer.from(await glb.arrayBuffer());
  await writeFile(path.join(previewDir, previewName), buffer);

  const updated = await updateBimModel(projectId, modelId, {
    status: "ready",
    gltfUrl: `/uploads/${projectId}/bim-previews/${previewName}`,
    metadata: buildMetadata(metadata),
    errorMessage: null,
  });

  return NextResponse.json(updated);
}
