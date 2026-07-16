import { shouldUseDatabase } from "@/lib/db/resolve";
import * as fileStore from "@/lib/ai/knowledge/drawing-asset-file-store";
import * as db from "@/lib/db/prisma-drawing-assets";
import { mockDrawingAssetsByProject } from "@/lib/mock-data/drawing-assets";
import type { DrawingAssetRecord, UpsertDrawingAssetInput } from "@/types/drawing";

export async function listDrawingAssetsByProject(projectId: string): Promise<DrawingAssetRecord[]> {
  if (await shouldUseDatabase()) {
    const rows = await db.listDrawingAssetsByProjectDb(projectId);
    return rows.length > 0 ? rows : mockDrawingAssetsByProject(projectId);
  }
  const rows = await fileStore.listDrawingAssetsFromFile(projectId);
  return rows.length > 0 ? rows : mockDrawingAssetsByProject(projectId);
}

export async function getDrawingAssetByDocument(
  projectId: string,
  documentId: string,
  pageNumber = 1
): Promise<DrawingAssetRecord | null> {
  const assets = await listDrawingAssetsByProject(projectId);
  return assets.find((a) => a.documentId === documentId && a.pageNumber === pageNumber) ?? null;
}

export async function upsertDrawingAsset(input: UpsertDrawingAssetInput): Promise<DrawingAssetRecord> {
  if (await shouldUseDatabase()) {
    return db.upsertDrawingAssetDb(input);
  }
  return fileStore.upsertDrawingAssetInFile(input);
}
