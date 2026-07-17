import type { BimRoomInfo } from "@/types/bim";

export interface ElevatorCandidateSpace {
  roomId: string;
  label: string;
  width: number;
  depth: number;
  area: number;
  matchReason: string;
}

const PREFERRED_KEYWORDS = [
  "楼梯",
  "天井",
  "设备",
  "储藏",
  "井道",
  "shaft",
  "stair",
  "void",
  "storage",
  "elevator",
  "电梯",
];

const EXCLUDED_KEYWORDS = [
  "卫生间",
  "厕所",
  "wc",
  "toilet",
  "restroom",
  "机房",
  "配电",
  "水泵",
  "锅炉",
  "kitchen",
  "厨房",
  "卧室",
  "bedroom",
];

function computeBoundingBoxDimensions(polygon: { x: number; y: number }[]) {
  const xs = polygon.map((p) => p.x);
  const ys = polygon.map((p) => p.y);
  const width = Math.max(...xs) - Math.min(...xs);
  const depth = Math.max(...ys) - Math.min(...ys);
  return {
    width: Math.min(width, depth),
    depth: Math.max(width, depth),
  };
}

function labelMatchesKeywords(label: string, keywords: string[]) {
  const lower = label.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

function aspectRatio(width: number, depth: number) {
  if (width <= 0 || depth <= 0) return 0;
  return Math.min(width, depth) / Math.max(width, depth);
}

function scoreCandidate(
  room: BimRoomInfo,
  dims: { width: number; depth: number }
): ElevatorCandidateSpace | null {
  const label = room.label ?? "";
  const minSide = Math.min(dims.width, dims.depth);

  if (labelMatchesKeywords(label, EXCLUDED_KEYWORDS)) {
    return null;
  }

  const preferred = labelMatchesKeywords(label, PREFERRED_KEYWORDS);
  const ratio = aspectRatio(dims.width, dims.depth);
  const squareish = ratio >= 0.6 && ratio <= 1.6;
  const areaInRange = room.area >= 4 && room.area <= 8;

  if (!preferred && !(areaInRange && squareish)) {
    return null;
  }

  const matchReason = preferred
    ? `Label matches preferred shaft/stair/storage keyword: "${label}"`
    : `Area ${room.area.toFixed(1)} m² with aspect ratio ${ratio.toFixed(2)} (4–8 m², near-square)`;

  return {
    roomId: room.id,
    label,
    width: dims.width,
    depth: dims.depth,
    area: room.area,
    matchReason,
    _minSide: minSide,
  } as ElevatorCandidateSpace & { _minSide: number };
}

export function findElevatorCandidateSpaces(rooms: BimRoomInfo[]): ElevatorCandidateSpace[] {
  const candidates: Array<ElevatorCandidateSpace & { _minSide: number }> = [];

  for (const room of rooms) {
    let dims: { width: number; depth: number };

    if (room.polygon && room.polygon.length >= 3) {
      dims = computeBoundingBoxDimensions(room.polygon);
    } else if (room.area > 0) {
      const side = Math.sqrt(room.area);
      dims = { width: side, depth: side };
    } else {
      continue;
    }

    const candidate = scoreCandidate(room, dims);
    if (candidate) {
      candidates.push(candidate as ElevatorCandidateSpace & { _minSide: number });
    }
  }

  return candidates
    .sort((a, b) => b._minSide - a._minSide)
    .map(({ _minSide: _, ...rest }) => rest);
}
