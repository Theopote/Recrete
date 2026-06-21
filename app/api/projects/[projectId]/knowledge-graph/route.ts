import { NextResponse } from "next/server";
import { getProjectById, getProjectEvidence } from "@/lib/db/repository";
import { listDrawingAssetsByProject } from "@/lib/db/drawing-assets";
import { analyzeProjectDocuments, mergeDrawingGraphs } from "@/lib/ai/document-analysis-pipeline";
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
  const project = await getProjectById(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

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
  const project = await getProjectById(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const results = await analyzeProjectDocuments(project, {
    language: body.language ?? "auto",
    includeOCR: true,
    extractTables: true,
  });

  return NextResponse.json({ results, count: results.length });
}
