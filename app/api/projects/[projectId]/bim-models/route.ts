import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { listBimModels } from "@/lib/bim/bim-model-repository";
import { createBimModelFromUpload } from "@/lib/bim/process-model-upload";
import {
  isCadDrawingFile,
  syncBimCadToDocument,
} from "@/lib/building-condition/unified-cad-sync";
import { guardOrRespond } from "@/lib/auth/api-guard";
import { requireProjectAccess } from "@/lib/auth/authorize";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;

  const models = await listBimModels(projectId);
  return NextResponse.json({ models });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;

  const denied = await guardOrRespond("POST", "/api/projects/*/bim-models");
  if (denied) return denied;

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

    const docLink = isCadDrawingFile(file.name)
      ? await syncBimCadToDocument({
          projectId,
          organizationId: access.user.organizationId,
          model,
          uploadedById: userId ?? "user-1",
        })
      : null;

    return NextResponse.json({
      ...model,
      documentId: docLink?.documentId,
      analysisTaskId: docLink?.analysisTaskId,
      openBuildingCondition: isCadDrawingFile(file.name),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 }
    );
  }
}
