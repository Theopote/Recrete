import { IFCSPACE } from "web-ifc";
import type * as WebIFC from "web-ifc";
import {
  bufferGeometryFromPlacedMesh,
  computeProjectedMeshArea,
} from "@/lib/bim/ifc-geometry";
import type { BimRoomInfo } from "@/types/bim";

const AREA_PROPERTY_KEYS = [
  "NetFloorArea",
  "GrossFloorArea",
  "NetFloorAreaMeasure",
  "GrossFloorAreaMeasure",
  "Area",
  "GrossArea",
  "NetArea",
];

function readIfcText(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "object" && value !== null && "value" in value) {
    const inner = (value as { value?: unknown }).value;
    return typeof inner === "string" ? inner.trim() || null : null;
  }
  return null;
}

function readNumeric(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "object" && value !== null && "value" in value) {
    const inner = (value as { value?: unknown }).value;
    return typeof inner === "number" && Number.isFinite(inner) ? inner : null;
  }
  return null;
}

function findAreaInNode(node: unknown): number | null {
  if (!node || typeof node !== "object") return null;

  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findAreaInNode(item);
      if (found != null) return found;
    }
    return null;
  }

  const record = node as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (AREA_PROPERTY_KEYS.some((candidate) => key.includes(candidate))) {
      const numeric = readNumeric(record[key]);
      if (numeric != null && numeric > 0) return numeric;
    }
  }

  for (const value of Object.values(record)) {
    const found = findAreaInNode(value);
    if (found != null) return found;
  }

  return null;
}

function computeSpaceGeometryArea(ifcApi: WebIFC.IfcAPI, modelId: number, expressId: number) {
  const geometries: ReturnType<typeof bufferGeometryFromPlacedMesh>[] = [];

  ifcApi.StreamMeshes(modelId, [expressId], (flatMesh) => {
    const placedGeometries = flatMesh.geometries;
    for (let i = 0; i < placedGeometries.size(); i++) {
      geometries.push(
        bufferGeometryFromPlacedMesh(ifcApi, modelId, placedGeometries.get(i))
      );
    }
  });

  if (geometries.length === 0) {
    const flatMesh = ifcApi.GetFlatMesh(modelId, expressId);
    const placedGeometries = flatMesh.geometries;
    for (let i = 0; i < placedGeometries.size(); i++) {
      geometries.push(
        bufferGeometryFromPlacedMesh(ifcApi, modelId, placedGeometries.get(i))
      );
    }
    flatMesh.delete();
  }

  return geometries.reduce((sum, geometry) => sum + computeProjectedMeshArea(geometry), 0);
}

function computeSpaceCentroid(ifcApi: WebIFC.IfcAPI, modelId: number, expressId: number) {
  const geometries: ReturnType<typeof bufferGeometryFromPlacedMesh>[] = [];

  ifcApi.StreamMeshes(modelId, [expressId], (flatMesh) => {
    const placedGeometries = flatMesh.geometries;
    for (let i = 0; i < placedGeometries.size(); i++) {
      geometries.push(
        bufferGeometryFromPlacedMesh(ifcApi, modelId, placedGeometries.get(i))
      );
    }
  });

  if (geometries.length === 0) {
    const flatMesh = ifcApi.GetFlatMesh(modelId, expressId);
    const placedGeometries = flatMesh.geometries;
    for (let i = 0; i < placedGeometries.size(); i++) {
      geometries.push(
        bufferGeometryFromPlacedMesh(ifcApi, modelId, placedGeometries.get(i))
      );
    }
    flatMesh.delete();
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const geometry of geometries) {
    const position = geometry.getAttribute("position");
    if (!position) continue;
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (!Number.isFinite(minX)) return undefined;
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
}

export async function extractIfcSpaces(
  ifcApi: WebIFC.IfcAPI,
  modelId: number
): Promise<BimRoomInfo[]> {
  const rooms: BimRoomInfo[] = [];
  const spaceIds = ifcApi.GetLineIDsWithType(modelId, IFCSPACE, true);

  for (let i = 0; i < spaceIds.size(); i++) {
    const expressId = spaceIds.get(i);
    const line = ifcApi.GetLine(modelId, expressId, true);
    const label =
      readIfcText(line?.LongName) ??
      readIfcText(line?.Name) ??
      readIfcText(line?.GlobalId) ??
      `Space ${expressId}`;

    let area = findAreaInNode(line);
    let source: BimRoomInfo["source"] = "ifc_space";

    if (area == null) {
      try {
        const propertySets = await ifcApi.properties.getPropertySets(modelId, expressId, true);
        area = findAreaInNode(propertySets);
      } catch {
        // Property extraction is best-effort.
      }
    }

    if (area == null || area <= 0) {
      area = computeSpaceGeometryArea(ifcApi, modelId, expressId);
      source = "ifc_geometry";
    }

    if (area <= 0) continue;

    const centroid = computeSpaceCentroid(ifcApi, modelId, expressId);

    rooms.push({
      id: `ifc-${expressId}`,
      label,
      area: Math.round(area * 100) / 100,
      areaUnit: "m2",
      source,
      expressId,
      centroid,
    });
  }

  return rooms.sort((a, b) => b.area - a.area);
}
