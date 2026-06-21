import type { DrawingAnalysisResult } from "@/lib/ai/vision/types";

export type GraphNodeType =
  | "sheet"
  | "room"
  | "dimension"
  | "annotation"
  | "structural_element";

export type GraphEdgeRelation =
  | "contains"
  | "labels"
  | "dimension_of"
  | "part_of"
  | "references";

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  properties: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation: GraphEdgeRelation;
}

export interface DrawingKnowledgeGraph {
  projectId: string;
  documentId: string;
  documentName: string;
  drawingType: DrawingAnalysisResult["drawingType"];
  scale?: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  updatedAt: string;
}

/**
 * Build a knowledge graph from drawing analysis results.
 * Links rooms, dimensions, annotations, and structural elements.
 */
export function buildDrawingKnowledgeGraph(
  projectId: string,
  documentId: string,
  documentName: string,
  analysis: DrawingAnalysisResult
): DrawingKnowledgeGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  const sheetId = `sheet:${documentId}`;
  nodes.push({
    id: sheetId,
    type: "sheet",
    label: documentName,
    properties: {
      drawingType: analysis.drawingType,
      scale: analysis.scale,
      orientation: analysis.orientation,
      confidence: analysis.confidence,
    },
  });

  for (const room of analysis.rooms) {
    const nodeId = `room:${documentId}:${room.id}`;
    nodes.push({
      id: nodeId,
      type: "room",
      label: room.label,
      properties: {
        area: room.area,
        function: room.function,
        dimensions: room.dimensions,
        boundingBox: room.location,
      },
    });
    edges.push({
      id: `edge:${sheetId}:${nodeId}`,
      source: sheetId,
      target: nodeId,
      relation: "contains",
    });
  }

  for (const [i, dim] of analysis.dimensions.entries()) {
    const nodeId = `dim:${documentId}:${i}`;
    nodes.push({
      id: nodeId,
      type: "dimension",
      label: `${dim.value}${dim.unit}`,
      properties: { value: dim.value, unit: dim.unit, type: dim.type, boundingBox: dim.location },
    });
    edges.push({
      id: `edge:${sheetId}:${nodeId}`,
      source: sheetId,
      target: nodeId,
      relation: "contains",
    });
  }

  for (const [i, ann] of analysis.annotations.entries()) {
    const nodeId = `ann:${documentId}:${i}`;
    nodes.push({
      id: nodeId,
      type: "annotation",
      label: ann.text,
      properties: { annotationType: ann.type, boundingBox: ann.location },
    });
    edges.push({
      id: `edge:${sheetId}:${nodeId}`,
      source: sheetId,
      target: nodeId,
      relation: "labels",
    });
  }

  for (const elem of analysis.structuralElements) {
    const nodeId = `struct:${documentId}:${elem.id ?? elem.type}`;
    nodes.push({
      id: nodeId,
      type: "structural_element",
      label: elem.id ?? elem.type,
      properties: {
        elementType: elem.type,
        size: elem.size,
        material: elem.material,
        boundingBox: elem.location,
      },
    });
    edges.push({
      id: `edge:${sheetId}:${nodeId}`,
      source: sheetId,
      target: nodeId,
      relation: "part_of",
    });

    for (const room of analysis.rooms) {
      if (isOverlapping(elem.location, room.location)) {
        edges.push({
          id: `edge:${nodeId}:room:${room.id}`,
          source: nodeId,
          target: `room:${documentId}:${room.id}`,
          relation: "references",
        });
      }
    }
  }

  return {
    projectId,
    documentId,
    documentName,
    drawingType: analysis.drawingType,
    scale: analysis.scale,
    nodes,
    edges,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Merge multiple drawing graphs into a project-level graph.
 */
export function mergeDrawingGraphs(graphs: DrawingKnowledgeGraph[]): DrawingKnowledgeGraph | null {
  if (graphs.length === 0) return null;
  if (graphs.length === 1) return graphs[0];

  const projectId = graphs[0].projectId;
  const mergedNodes: GraphNode[] = [];
  const mergedEdges: GraphEdge[] = [];

  for (const graph of graphs) {
    mergedNodes.push(...graph.nodes);
    mergedEdges.push(...graph.edges);
  }

  return {
    projectId,
    documentId: "merged",
    documentName: "Project Drawing Set",
    drawingType: "unknown",
    nodes: mergedNodes,
    edges: mergedEdges,
    updatedAt: new Date().toISOString(),
  };
}

function isOverlapping(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}
