import { NextResponse } from "next/server";
import { getProjectById, getProjectEvidence } from "@/lib/db/repository";
import { analyzeProjectDocuments, mergeDrawingGraphs } from "@/lib/ai/document-analysis-pipeline";
import type { DrawingKnowledgeGraph } from "@/lib/ai/knowledge/drawing-knowledge-graph";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const project = await getProjectById(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const graphs: DrawingKnowledgeGraph[] = [];

  for (const doc of project.documents ?? []) {
    if (!doc.extractedText?.includes("Knowledge Graph")) continue;
    try {
      const graphStart = doc.extractedText.indexOf("--- Knowledge Graph ---");
      if (graphStart >= 0) {
        const jsonStr = doc.extractedText.slice(graphStart + "--- Knowledge Graph ---".length).trim();
        graphs.push(JSON.parse(jsonStr) as DrawingKnowledgeGraph);
      }
    } catch {
      // skip invalid graph data
    }
  }

  const merged = mergeDrawingGraphs(graphs);
  const evidence = await getProjectEvidence(projectId);

  return NextResponse.json({
    graphs,
    mergedGraph: merged,
    nodeCount: merged?.nodes.length ?? 0,
    edgeCount: merged?.edges.length ?? 0,
    evidenceCount: evidence.length,
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
