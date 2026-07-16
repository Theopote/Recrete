import { NextResponse } from "next/server";
import { requireProjectAccess } from "@/lib/auth/authorize";
import { listDrawingAssetsByProject } from "@/lib/db/drawing-assets";
import { listBimModels } from "@/lib/db/bim-models";
import type { DrawingAssetWithDocument } from "@/types/drawing";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;
  const { project } = access;

  const assets = await listDrawingAssetsByProject(projectId);
  const bimModels = await listBimModels(projectId);
  const docById = new Map((project.documents ?? []).map((d) => [d.id, d]));

  const enriched: DrawingAssetWithDocument[] = assets.map((asset) => {
    const doc = docById.get(asset.documentId);
    const linkedBim = doc
      ? bimModels.find((m) => m.fileUrl === doc.fileUrl)
      : undefined;
    return {
      ...asset,
      documentName: doc?.name ?? asset.documentId,
      documentFileUrl: doc?.fileUrl ?? "",
      documentMimeType: doc?.mimeType ?? "application/octet-stream",
      documentCategory: doc?.category ?? "others",
      bimPreviewUrl: linkedBim?.previewUrl ?? null,
      bimModelId: linkedBim?.id ?? null,
    };
  });

  const disciplineCounts = {
    floor_plan: enriched.filter((a) => a.drawingType === "floor_plan").length,
    elevation: enriched.filter((a) => a.drawingType === "elevation").length,
    section: enriched.filter((a) => a.drawingType === "section").length,
    structural: enriched.filter((a) => a.drawingType === "structural").length,
    mep: enriched.filter((a) => a.drawingType === "mep").length,
    detail: enriched.filter((a) => a.drawingType === "detail").length,
    unknown: enriched.filter((a) => a.drawingType === "unknown").length,
  };

  return NextResponse.json({
    assets: enriched,
    count: enriched.length,
    disciplineCounts,
  });
}
