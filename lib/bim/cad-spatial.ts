import type { DwgDatabase } from "@mlightcad/libredwg-web";
import type { BimPoint2D, BimRoomInfo } from "@/types/bim";
import { polygonCentroid } from "@/lib/bim/room-geometry";

interface Point2D {
  x: number;
  y: number;
}

interface PolylineEntity {
  type: string;
  isVisible?: boolean;
  layer?: string;
  flag?: number;
  vertices?: Point2D[];
}

const ROOM_LAYER_PATTERN = /room|space|area|分区|房间|空间/i;

function shoelaceArea(vertices: Point2D[]) {
  if (vertices.length < 3) return 0;

  let area = 0;
  for (let i = 0; i < vertices.length; i++) {
    const current = vertices[i];
    const next = vertices[(i + 1) % vertices.length];
    area += current.x * next.y - next.x * current.y;
  }

  return Math.abs(area) * 0.5;
}

function inferAreaScale(bounds: { minX: number; minY: number; maxX: number; maxY: number }) {
  const span = Math.max(
    Math.abs(bounds.maxX - bounds.minX),
    Math.abs(bounds.maxY - bounds.minY),
    1
  );

  // Typical architectural drawings use mm when spans exceed a few meters in raw units.
  return span > 1000 ? 1 / 1_000_000 : 1;
}

function isClosedPolyline(entity: PolylineEntity) {
  if (entity.type !== "LWPOLYLINE") return false;
  if ((entity.flag ?? 0) & 1) return true;

  const vertices = entity.vertices ?? [];
  if (vertices.length < 3) return false;
  const first = vertices[0];
  const last = vertices[vertices.length - 1];
  const tolerance = 1e-6;
  return (
    Math.abs(first.x - last.x) <= tolerance && Math.abs(first.y - last.y) <= tolerance
  );
}

export function extractCadRooms(
  db: DwgDatabase,
  bounds: { minX: number; minY: number; maxX: number; maxY: number }
): BimRoomInfo[] {
  const entities = (db.entities ?? []) as PolylineEntity[];
  const areaScale = inferAreaScale(bounds);
  const rooms: BimRoomInfo[] = [];
  let index = 0;

  for (const entity of entities) {
    if (entity.isVisible === false || !isClosedPolyline(entity)) continue;

    const rawArea = shoelaceArea(entity.vertices ?? []);
    const area = rawArea * areaScale;
    if (area < 0.5) continue;

    const layer = entity.layer?.trim();
    const label =
      layer && ROOM_LAYER_PATTERN.test(layer)
        ? layer
        : layer
          ? `${layer} ${++index}`
          : `Room ${++index}`;

    rooms.push({
      id: `cad-${rooms.length + 1}`,
      label,
      area: Math.round(area * 100) / 100,
      areaUnit: "m2",
      source: "cad_polyline",
      layer,
      polygon: (entity.vertices ?? []).map((vertex) => ({ x: vertex.x, y: vertex.y })),
      centroid: polygonCentroid(entity.vertices ?? []),
    });
  }

  return rooms.sort((a, b) => b.area - a.area);
}
