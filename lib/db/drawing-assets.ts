import { shouldUseDatabase } from "@/lib/db/resolve";
import * as fileStore from "@/lib/ai/knowledge/drawing-asset-file-store";
import * as db from "@/lib/db/prisma-drawing-assets";
import type { DrawingAssetRecord, UpsertDrawingAssetInput } from "@/types/drawing";

export async function listDrawingAssetsByProject(projectId: string): Promise<DrawingAssetRecord[]> {
  if (await shouldUseDatabase()) {
    return db.listDrawingAssetsByProjectDb(projectId);
  }
  return fileStore.listDrawingAssetsFromFile(projectId);
}

export async function upsertDrawingAsset(input: UpsertDrawingAssetInput): Promise<DrawingAssetRecord> {
  if (await shouldUseDatabase()) {
    return db.upsertDrawingAssetDb(input);
  }
  return fileStore.upsertDrawingAssetInFile(input);
}
