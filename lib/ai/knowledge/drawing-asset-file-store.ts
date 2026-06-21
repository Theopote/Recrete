import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { DrawingAssetRecord, UpsertDrawingAssetInput } from "@/types/drawing";

const DATA_DIR = path.join(process.cwd(), "data", "drawing-assets");

function manifestPath(projectId: string) {
  return path.join(DATA_DIR, `${projectId}.json`);
}

async function readManifest(projectId: string): Promise<DrawingAssetRecord[]> {
  try {
    const raw = await readFile(manifestPath(projectId), "utf8");
    const parsed = JSON.parse(raw) as DrawingAssetRecord[];
    return parsed.map((row) => ({
      ...row,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    }));
  } catch {
    return [];
  }
}

async function writeManifest(projectId: string, rows: DrawingAssetRecord[]) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(manifestPath(projectId), JSON.stringify(rows, null, 2), "utf8");
}

export async function listDrawingAssetsFromFile(projectId: string): Promise<DrawingAssetRecord[]> {
  const rows = await readManifest(projectId);
  return rows.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export async function getDrawingAssetByDocumentFromFile(
  documentId: string,
  pageNumber = 1
): Promise<DrawingAssetRecord | null> {
  const files = await import("fs/promises").then((fs) =>
    fs.readdir(DATA_DIR).catch(() => [] as string[])
  );
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const projectId = file.replace(/\.json$/, "");
    const rows = await readManifest(projectId);
    const match = rows.find((r) => r.documentId === documentId && r.pageNumber === pageNumber);
    if (match) return match;
  }
  return null;
}

export async function upsertDrawingAssetInFile(
  input: UpsertDrawingAssetInput
): Promise<DrawingAssetRecord> {
  const pageNumber = input.pageNumber ?? 1;
  const rows = await readManifest(input.projectId);
  const index = rows.findIndex(
    (r) => r.documentId === input.documentId && r.pageNumber === pageNumber
  );
  const now = new Date();

  if (index >= 0) {
    rows[index] = {
      ...rows[index],
      drawingType: input.drawingType,
      scale: input.scale ?? null,
      analysisResult: input.analysisResult,
      knowledgeGraph: input.knowledgeGraph ?? null,
      openCvResult: input.openCvResult ?? null,
      modelName: input.modelName,
      confidence: input.confidence,
      updatedAt: now,
    };
    await writeManifest(input.projectId, rows);
    return rows[index];
  }

  const record: DrawingAssetRecord = {
    id: `drawing-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    documentId: input.documentId,
    projectId: input.projectId,
    pageNumber,
    drawingType: input.drawingType,
    scale: input.scale ?? null,
    analysisResult: input.analysisResult,
    knowledgeGraph: input.knowledgeGraph ?? null,
    openCvResult: input.openCvResult ?? null,
    modelName: input.modelName,
    confidence: input.confidence,
    createdAt: now,
    updatedAt: now,
  };
  rows.push(record);
  await writeManifest(input.projectId, rows);
  return record;
}
