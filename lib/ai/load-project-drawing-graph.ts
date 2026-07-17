import "server-only";

import { listDrawingAssetsByProject } from "@/lib/db/drawing-assets";
import {
  buildDrawingKnowledgeGraph,
  mergeDrawingGraphs,
  type DrawingKnowledgeGraph,
} from "@/lib/ai/knowledge/drawing-knowledge-graph";

export async function loadProjectDrawingGraph(
  projectId: string,
  documentNames: Record<string, string> = {}
): Promise<DrawingKnowledgeGraph | null> {
  const assets = await listDrawingAssetsByProject(projectId);
  if (assets.length === 0) return null;

  const graphs = assets.map((asset) => {
    if (asset.knowledgeGraph) return asset.knowledgeGraph;
    return buildDrawingKnowledgeGraph(
      projectId,
      asset.documentId,
      documentNames[asset.documentId] ?? asset.documentId,
      asset.analysisResult
    );
  });

  return mergeDrawingGraphs(graphs);
}
