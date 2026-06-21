import type { BimPoint2D, BimRoomInfo } from "@/types/bim";

function distance(a: BimPoint2D, b: BimPoint2D) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function polygonCentroid(vertices: BimPoint2D[]): BimPoint2D {
  if (vertices.length === 0) return { x: 0, y: 0 };
  if (vertices.length < 3) {
    const sum = vertices.reduce(
      (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
      { x: 0, y: 0 }
    );
    return { x: sum.x / vertices.length, y: sum.y / vertices.length };
  }

  let area = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < vertices.length; i++) {
    const current = vertices[i];
    const next = vertices[(i + 1) % vertices.length];
    const cross = current.x * next.y - next.x * current.y;
    area += cross;
    cx += (current.x + next.x) * cross;
    cy += (current.y + next.y) * cross;
  }

  area *= 0.5;
  if (Math.abs(area) < 1e-9) {
    const sum = vertices.reduce(
      (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
      { x: 0, y: 0 }
    );
    return { x: sum.x / vertices.length, y: sum.y / vertices.length };
  }

  return { x: cx / (6 * area), y: cy / (6 * area) };
}

export function enrichRoomGeometry(
  room: BimRoomInfo,
  unitScale: number
): BimRoomInfo {
  const centroid =
    room.centroid ??
    (room.polygon?.length ? polygonCentroid(room.polygon) : undefined);

  return centroid ? { ...room, centroid } : room;
}

export function inferUnitScale(
  bounds: { minX: number; minY: number; maxX: number; maxY: number } | undefined,
  rooms: BimRoomInfo[]
) {
  if (bounds) {
    const span = Math.max(
      Math.abs(bounds.maxX - bounds.minX),
      Math.abs(bounds.maxY - bounds.minY),
      1
    );
    if (span > 1000) return 1 / 1000;
  }

  const avgArea = rooms.reduce((sum, room) => sum + room.area, 0) / Math.max(rooms.length, 1);
  if (avgArea > 5000) return 1 / 1000;
  return 1;
}

export function roomsWithCentroids(rooms: BimRoomInfo[], unitScale = 1) {
  return rooms
    .map((room) => enrichRoomGeometry(room, unitScale))
    .filter((room): room is BimRoomInfo & { centroid: BimPoint2D } => Boolean(room.centroid));
}

export function scaledDistance(a: BimPoint2D, b: BimPoint2D, unitScale: number) {
  return distance(a, b) * unitScale;
}

export { polygonCentroid, distance as pointDistance };
