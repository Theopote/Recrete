import { after } from "next/server";
import { saveUploadedFile } from "@/lib/storage/upload";
import { detectBimFormat } from "@/lib/bim/formats";
import { convertCadBufferToSvg } from "@/lib/bim/dwg-converter";
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

async function readUploadedFile(fileUrl: string) {
  const relative = fileUrl.replace(/^\//, "");
  const filePath = path.join(process.cwd(), "public", relative);
  return readFile(filePath);
}

async function processCadConversion(
  projectId: string,
  modelId: string,
  fileUrl: string,
  format: Extract<BimModelFormat, "dwg" | "dxf">
) {
  try {
    const buffer = await readUploadedFile(fileUrl);
    const result = await convertCadBufferToSvg(projectId, modelId, buffer, format);
    await updateBimModel(projectId, modelId, {
      status: "ready",
      previewUrl: result.previewUrl,
      metadata: buildMetadata(result.metadata),
      errorMessage: null,
    });
  } catch (error) {
    await updateBimModel(projectId, modelId, {
      status: "failed",
      errorMessage:
        error instanceof Error
          ? error.message
          : `${format.toUpperCase()} conversion failed`,
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
  const needsConversion = format === "dwg" || format === "dxf" || format === "ifc";

  const model: BimModel = {
    id: modelId,
    projectId: input.projectId,
    name: saved.name,
    format,
    status: needsConversion ? "processing" : "ready",
    fileUrl: saved.fileUrl,
    previewUrl: null,
    gltfUrl: null,
    fileSize: saved.fileSize,
    mimeType: saved.mimeType || MIME_BY_FORMAT[format],
    errorMessage: null,
    uploadedById: input.uploadedById,
    createdAt: now,
    updatedAt: now,
  };

  await addBimModel(model);

  if (format === "dwg" || format === "dxf") {
    after(async () => {
      await processCadConversion(input.projectId, modelId, saved.fileUrl, format);
    });
  }

  return { ...model, conversionQueued: needsConversion };
}

export { processCadConversion as processDwgConversion };
