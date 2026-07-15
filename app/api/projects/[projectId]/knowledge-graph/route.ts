import { NextResponse } from "next/server";
import { getProjectEvidence } from "@/lib/db/repository";
import { requireProjectAccess } from "@/lib/auth/authorize";
import { listDrawingAssetsByProject } from "@/lib/db/drawing-assets";
import { mergeDrawingGraphs } from "@/lib/ai/document-analysis-pipeline";
import { runDocumentIngestWorkflow } from "@/lib/ai/workflow";
import type { DrawingKnowledgeGraph } from "@/lib/ai/knowledge/drawing-knowledge-graph";

function parseLegacyGraphFromExtractedText(extractedText: string): DrawingKnowledgeGraph | null {
  if (!extractedText.includes("Knowledge Graph")) return null;
  try {
    const graphStart = extractedText.indexOf("--- Knowledge Graph ---");
    if (graphStart < 0) return null;
    const jsonStr = extractedText.slice(graphStart + "--- Knowledge Graph ---".length).trim();
    return JSON.parse(jsonStr) as DrawingKnowledgeGraph;
  } catch {
    return null;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;
  const { project } = access;

  const drawingAssets = await listDrawingAssetsByProject(projectId);
  const graphsFromAssets = drawingAssets
    .map((asset) => asset.knowledgeGraph)
    .filter((graph): graph is DrawingKnowledgeGraph => graph != null);

  const legacyGraphs: DrawingKnowledgeGraph[] = [];
  for (const doc of project.documents ?? []) {
    if (!doc.extractedText) continue;
    const legacy = parseLegacyGraphFromExtractedText(doc.extractedText);
    if (legacy && !graphsFromAssets.some((g) => g.documentId === legacy.documentId)) {
      legacyGraphs.push(legacy);
    }
  }

  const graphs = [...graphsFromAssets, ...legacyGraphs];
  const merged = mergeDrawingGraphs(graphs);
  const evidence = await getProjectEvidence(projectId);

  return NextResponse.json({
    graphs,
    mergedGraph: merged,
    nodeCount: merged?.nodes.length ?? 0,
    edgeCount: merged?.edges.length ?? 0,
    evidenceCount: evidence.length,
    drawingAssetCount: drawingAssets.length,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;
  const { project, user } = access;

  const body = await request.json().catch(() => ({}));
  const language = body.language === "zh" ? "zh" : body.language === "en" ? "en" : "auto";
  const createIssues = body.createIssues !== false;
  const refreshBuildingMemory = body.refreshBuildingMemory !== false;

  const docs = project.documents ?? [];
  const results = [];

  for (let i = 0; i < docs.length; i++) {
    const result = await runDocumentIngestWorkflow(projectId, user.organizationId, docs[i].id, {
      language,
      createIssues,
      refreshBuildingMemory: refreshBuildingMemory && i === docs.length - 1,
    });
    if (result) results.push(result);
  }

  const drawingAssets = await listDrawingAssetsByProject(projectId);
  const graphs = drawingAssets
    .map((asset) => asset.knowledgeGraph)
    .filter((graph): graph is DrawingKnowledgeGraph => graph != null);
  const mergedGraph = mergeDrawingGraphs(graphs);

  return NextResponse.json({
    results,
    count: results.length,
    drawingAssetCount: drawingAssets.length,
    mergedGraph,
    nodeCount: mergedGraph?.nodes.length ?? 0,
    edgeCount: mergedGraph?.edges.length ?? 0,
  });
}
