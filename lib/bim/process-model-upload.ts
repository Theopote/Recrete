import { after } from "next/server";
import { saveUploadedFile } from "@/lib/storage/upload";
import { detectBimFormat } from "@/lib/bim/formats";
import { convertDwgBufferToSvg } from "@/lib/bim/dwg-converter";
import {
  addBimModel,
  buildMetadata,
  updateBimModel,
} from "@/lib/bim/bim-model-repository";
import type { BimModel, BimModelFormat } from "@/types/bim";
import { readFile } from "fs/promises";
import path from "path";

function generateModelId() {
  return `bim-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const MIME_BY_FORMAT: Record<BimModelFormat, string> = {
  ifc: "application/x-step",
  dwg: "application/acad",
  dxf: "application/dxf",
};

async function processDwgConversion(projectId: string, modelId: string, fileUrl: string) {
  try {
    const relative = fileUrl.replace(/^\//, "");
    const filePath = path.join(process.cwd(), "public", relative);
    const buffer = await readFile(filePath);
    const result = await convertDwgBufferToSvg(projectId, modelId, buffer);
    await updateBimModel(projectId, modelId, {
      status: "ready",
      previewUrl: result.previewUrl,
      metadata: buildMetadata({
        entityCount: result.entityCount,
        layerCount: result.layerCount,
        bounds: result.bounds,
      }),
      errorMessage: null,
    });
  } catch (error) {
    await updateBimModel(projectId, modelId, {
      status: "failed",
      errorMessage:
        error instanceof Error ? error.message : "DWG conversion failed",
    });
  }
}

export async function createBimModelFromUpload(input: {
  projectId: string;
  file: File;
  uploadedById: string;
}) {
  const { format, unsupportedReason } = detectBimFormat(input.file.name);
  if (!format) {
    throw new Error(unsupportedReason ?? "Unsupported file format");
  }

  const saved = await saveUploadedFile(input.projectId, input.file);
  const now = new Date();
  const modelId = generateModelId();
  const needsConversion = format === "dwg";
  const isDxf = format === "dxf";

  const model: BimModel = {
    id: modelId,
    projectId: input.projectId,
    name: saved.name,
    format,
    status: isDxf ? "unsupported" : needsConversion ? "processing" : "ready",
    fileUrl: saved.fileUrl,
    previewUrl: null,
    fileSize: saved.fileSize,
    mimeType: saved.mimeType || MIME_BY_FORMAT[format],
    errorMessage: isDxf
      ? "DXF direct import is disabled in the bundled LibreDWG build. Upload DWG or export to IFC."
      : null,
    uploadedById: input.uploadedById,
    createdAt: now,
    updatedAt: now,
  };

  await addBimModel(model);

  if (needsConversion) {
    after(async () => {
      await processDwgConversion(input.projectId, modelId, saved.fileUrl);
    });
  }

  return { ...model, conversionQueued: needsConversion };
}

export { processDwgConversion };
