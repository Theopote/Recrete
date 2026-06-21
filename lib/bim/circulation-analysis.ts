import type {
  BimCirculationAnalysis,
  BimCirculationPath,
  BimPoint2D,
  BimRoomInfo,
} from "@/types/bim";
import { roomsWithCentroids, scaledDistance } from "@/lib/bim/room-geometry";

interface GraphEdge {
  to: string;
  weight: number;
}

function buildAdjacency(
  rooms: Array<BimRoomInfo & { centroid: BimPoint2D }>,
  unitScale: number
) {
  const areas = rooms.map((room) => room.area).sort((a, b) => a - b);
  const medianArea = areas[Math.floor(areas.length / 2)] ?? 20;
  const maxDistance = Math.sqrt(Math.max(medianArea, 4)) * 2.5 / Math.max(unitScale, 1e-6);
  const graph = new Map<string, GraphEdge[]>();

  for (const room of rooms) {
    graph.set(room.id, []);
  }

  for (let i = 0; i < rooms.length; i++) {
    const distances = rooms
      .map((other) => ({
        id: other.id,
        distance: scaledDistance(rooms[i].centroid, other.centroid, unitScale),
      }))
      .filter((entry) => entry.id !== rooms[i].id)
      .sort((a, b) => a.distance - b.distance);

    const neighbors = distances.slice(0, 3).filter((entry) => entry.distance <= maxDistance);
    for (const neighbor of neighbors) {
      graph.get(rooms[i].id)?.push({ to: neighbor.id, weight: neighbor.distance });
      graph.get(neighbor.id)?.push({ to: rooms[i].id, weight: neighbor.distance });
    }
  }

  return graph;
}

function dijkstra(
  graph: Map<string, GraphEdge[]>,
  startId: string,
  endId: string
) {
  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const unvisited = new Set(graph.keys());

  for (const node of graph.keys()) {
    distances.set(node, node === startId ? 0 : Number.POSITIVE_INFINITY);
    previous.set(node, null);
  }

  while (unvisited.size > 0) {
    let current: string | null = null;
    let currentDistance = Number.POSITIVE_INFINITY;
    for (const node of unvisited) {
      const distance = distances.get(node) ?? Number.POSITIVE_INFINITY;
      if (distance < currentDistance) {
        current = node;
        currentDistance = distance;
      }
    }

    if (!current || currentDistance === Number.POSITIVE_INFINITY) break;
    if (current === endId) break;
    unvisited.delete(current);

    for (const edge of graph.get(current) ?? []) {
      if (!unvisited.has(edge.to)) continue;
      const alt = currentDistance + edge.weight;
      if (alt < (distances.get(edge.to) ?? Number.POSITIVE_INFINITY)) {
        distances.set(edge.to, alt);
        previous.set(edge.to, current);
      }
    }
  }

  if ((distances.get(endId) ?? Number.POSITIVE_INFINITY) === Number.POSITIVE_INFINITY) {
    return null;
  }

  const path: string[] = [];
  let cursor: string | null = endId;
  while (cursor) {
    path.unshift(cursor);
    cursor = previous.get(cursor) ?? null;
  }

  return { roomIds: path, length: distances.get(endId) ?? 0 };
}

function findEntryRoom(rooms: Array<BimRoomInfo & { centroid: BimPoint2D }>) {
  const entryPattern = /entry|lobby|hall|门厅|入口|大堂|前厅/i;
  const matched = rooms.find(
    (room) => entryPattern.test(room.label) || entryPattern.test(room.layer ?? "")
  );
  if (matched) return matched;

  return [...rooms].sort((a, b) => b.area - a.area)[0];
}

function buildPath(
  rooms: Array<BimRoomInfo & { centroid: BimPoint2D }>,
  route: { roomIds: string[]; length: number }
): BimCirculationPath {
  const roomMap = new Map(rooms.map((room) => [room.id, room]));
  const fromRoom = roomMap.get(route.roomIds[0]);
  const toRoom = roomMap.get(route.roomIds[route.roomIds.length - 1]);

  return {
    id: `${route.roomIds[0]}-${route.roomIds[route.roomIds.length - 1]}`,
    fromRoomId: route.roomIds[0],
    toRoomId: route.roomIds[route.roomIds.length - 1],
    fromLabel: fromRoom?.label ?? route.roomIds[0],
    toLabel: toRoom?.label ?? route.roomIds[route.roomIds.length - 1],
    roomIds: route.roomIds,
    points: route.roomIds
      .map((roomId) => roomMap.get(roomId)?.centroid)
      .filter((point): point is BimPoint2D => Boolean(point)),
    length: Math.round(route.length * 100) / 100,
    lengthUnit: "m",
  };
}

export function analyzeCirculation(
  rooms: BimRoomInfo[],
  unitScale = 1,
  options?: { fromRoomId?: string; toRoomId?: string }
): BimCirculationAnalysis {
  const locatedRooms = roomsWithCentroids(rooms, unitScale);
  if (locatedRooms.length < 2) {
    return { paths: [], adjacencyCount: 0, unitScale };
  }

  const graph = buildAdjacency(locatedRooms, unitScale);
  const adjacencyCount = [...graph.values()].reduce((sum, edges) => sum + edges.length, 0) / 2;

  const entry = findEntryRoom(locatedRooms);
  const targets = options?.toRoomId
    ? locatedRooms.filter((room) => room.id === options.toRoomId)
    : [...locatedRooms]
        .filter((room) => room.id !== entry.id)
        .sort((a, b) => b.area - a.area)
        .slice(0, 4);

  const startId = options?.fromRoomId ?? entry.id;
  const paths: BimCirculationPath[] = [];

  for (const target of targets) {
    if (target.id === startId) continue;
    const route = dijkstra(graph, startId, target.id);
    if (!route) continue;
    paths.push(buildPath(locatedRooms, route));
  }

  let mainSpine: BimCirculationPath | undefined;
  let longest = 0;
  for (let i = 0; i < locatedRooms.length; i++) {
    for (let j = i + 1; j < locatedRooms.length; j++) {
      const route = dijkstra(graph, locatedRooms[i].id, locatedRooms[j].id);
      if (!route || route.length <= longest) continue;
      longest = route.length;
      mainSpine = buildPath(locatedRooms, route);
    }
  }

  const averagePathLength =
    paths.length > 0
      ? Math.round((paths.reduce((sum, path) => sum + path.length, 0) / paths.length) * 100) / 100
      : undefined;

  return {
    paths,
    mainSpine,
    adjacencyCount: Math.round(adjacencyCount),
    averagePathLength,
    unitScale,
  };
}

export function findCirculationPath(
  rooms: BimRoomInfo[],
  fromRoomId: string,
  toRoomId: string,
  unitScale = 1
) {
  return analyzeCirculation(rooms, unitScale, { fromRoomId, toRoomId }).paths[0] ?? null;
}
