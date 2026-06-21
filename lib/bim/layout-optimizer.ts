import type { BimPoint2D, BimRoomInfo } from "@/types/bim";
import { roomsWithCentroids } from "@/lib/bim/room-geometry";

export interface ProgramZone {
  id: string;
  label: string;
  labelZh: string;
  minArea: number;
  idealArea: number;
  keywords: string[];
}

export interface RoomFunctionAssignment {
  roomId: string;
  roomLabel: string;
  area: number;
  assignedFunction: string;
  assignedFunctionZh: string;
  fitScore: number;
  rationale: string;
}

export interface LayoutOptimizationResult {
  targetFunction: string;
  totalArea: number;
  assignments: RoomFunctionAssignment[];
  overallScore: number;
  suggestions: string[];
  unassignedZones: string[];
}

const PROGRAM_LIBRARY: Record<string, ProgramZone[]> = {
  default: [
    { id: "entry", label: "Entry / Lobby", labelZh: "门厅/入口", minArea: 15, idealArea: 40, keywords: ["entry", "lobby", "hall", "门厅", "入口", "大堂"] },
    { id: "circulation", label: "Circulation", labelZh: "交通空间", minArea: 8, idealArea: 25, keywords: ["corridor", "hallway", "走廊", "通道", "过厅"] },
    { id: "primary", label: "Primary Program", labelZh: "主功能空间", minArea: 30, idealArea: 120, keywords: ["office", "exhibition", "gallery", "展厅", "办公", "活动"] },
    { id: "support", label: "Support", labelZh: "辅助空间", minArea: 10, idealArea: 30, keywords: ["storage", "utility", "storage", "储藏", "设备"] },
    { id: "service", label: "Service", labelZh: "服务空间", minArea: 5, idealArea: 15, keywords: ["toilet", "bathroom", "kitchen", "卫生间", "厨房", "盥洗"] },
  ],
  cultural: [
    { id: "entry", label: "Public Entry", labelZh: "公共门厅", minArea: 25, idealArea: 80, keywords: ["entry", "lobby", "门厅", "入口"] },
    { id: "exhibition", label: "Exhibition", labelZh: "展览空间", minArea: 40, idealArea: 200, keywords: ["exhibition", "gallery", "hall", "展厅", "展示"] },
    { id: "gathering", label: "Gathering", labelZh: "集会/多功能", minArea: 50, idealArea: 150, keywords: ["multipurpose", "auditorium", "lecture", "多功能", "讲堂"] },
    { id: "workshop", label: "Workshop", labelZh: "工作坊", minArea: 20, idealArea: 60, keywords: ["workshop", "studio", "创作", "工作室"] },
    { id: "circulation", label: "Circulation", labelZh: "交通", minArea: 10, idealArea: 30, keywords: ["corridor", "走廊"] },
    { id: "service", label: "Service", labelZh: "服务", minArea: 5, idealArea: 20, keywords: ["toilet", "卫生间", "厨房"] },
  ],
  office: [
    { id: "entry", label: "Reception", labelZh: "接待", minArea: 15, idealArea: 40, keywords: ["reception", "lobby", "接待", "门厅"] },
    { id: "open_office", label: "Open Office", labelZh: "开放办公", minArea: 30, idealArea: 150, keywords: ["office", "open", "办公"] },
    { id: "meeting", label: "Meeting", labelZh: "会议", minArea: 12, idealArea: 35, keywords: ["meeting", "conference", "会议"] },
    { id: "circulation", label: "Circulation", labelZh: "交通", minArea: 8, idealArea: 25, keywords: ["corridor", "走廊"] },
    { id: "service", label: "Service", labelZh: "服务", minArea: 5, idealArea: 15, keywords: ["toilet", "kitchen", "卫生间"] },
  ],
};

function resolveProgramSet(targetFunction: string): ProgramZone[] {
  const lower = targetFunction.toLowerCase();
  if (/文化|展览|社区|gallery|cultural|museum|community/.test(lower)) {
    return PROGRAM_LIBRARY.cultural;
  }
  if (/办公|office|commercial|商业/.test(lower)) {
    return PROGRAM_LIBRARY.office;
  }
  return PROGRAM_LIBRARY.default;
}

function labelMatchesZone(room: BimRoomInfo, zone: ProgramZone): number {
  const text = `${room.label} ${room.layer ?? ""}`.toLowerCase();
  for (const kw of zone.keywords) {
    if (text.includes(kw.toLowerCase())) return 0.95;
  }
  return 0;
}

function areaFitScore(area: number, zone: ProgramZone): number {
  if (area < zone.minArea * 0.5) return 0.2;
  if (area < zone.minArea) return 0.55;
  const diff = Math.abs(area - zone.idealArea);
  const spread = Math.max(zone.idealArea, 1);
  return Math.max(0.4, 1 - diff / spread);
}

function proximityToEntry(
  room: BimRoomInfo & { centroid: BimPoint2D },
  entry: (BimRoomInfo & { centroid: BimPoint2D }) | undefined
): number {
  if (!entry || room.id === entry.id) return 1;
  const dist = Math.hypot(room.centroid.x - entry.centroid.x, room.centroid.y - entry.centroid.y);
  return Math.max(0, 1 - dist / 5000);
}

export function optimizeFunctionalLayout(
  rooms: BimRoomInfo[],
  targetFunction: string,
  unitScale = 1
): LayoutOptimizationResult {
  const located = roomsWithCentroids(rooms, unitScale);
  const zones = resolveProgramSet(targetFunction);
  const totalArea = rooms.reduce((s, r) => s + r.area, 0);

  const entryPattern = /entry|lobby|hall|门厅|入口|大堂/i;
  const entry =
    located.find((r) => entryPattern.test(r.label) || entryPattern.test(r.layer ?? "")) ??
    [...located].sort((a, b) => b.area - a.area)[0];

  const assignedZoneIds = new Set<string>();
  const assignments: RoomFunctionAssignment[] = [];

  const sortedRooms = [...located].sort((a, b) => b.area - a.area);

  for (const room of sortedRooms) {
    let bestZone = zones[0];
    let bestScore = 0;

    for (const zone of zones) {
      const labelScore = labelMatchesZone(room, zone);
      const areaScore = areaFitScore(room.area, zone);
      let score = labelScore * 0.5 + areaScore * 0.35;

      if (zone.id === "entry" || zone.id === "circulation") {
        score += proximityToEntry(room, entry) * 0.15;
      }
      if (zone.id === "exhibition" || zone.id === "primary" || zone.id === "open_office") {
        score += (room.area / Math.max(totalArea, 1)) * 0.2;
      }
      if (assignedZoneIds.has(zone.id) && labelScore < 0.9) {
        score *= 0.85;
      }

      if (score > bestScore) {
        bestScore = score;
        bestZone = zone;
      }
    }

    assignedZoneIds.add(bestZone.id);
    const fitScore = Math.round(bestScore * 100);

    assignments.push({
      roomId: room.id,
      roomLabel: room.label,
      area: room.area,
      assignedFunction: bestZone.label,
      assignedFunctionZh: bestZone.labelZh,
      fitScore,
      rationale:
        fitScore >= 80
          ? `面积 ${room.area.toFixed(0)} m² 与 ${bestZone.labelZh} 需求匹配`
          : fitScore >= 55
            ? `可调整为 ${bestZone.labelZh}，建议复核净高与采光`
            : `当前标注与 ${bestZone.labelZh} 匹配度偏低，建议现场复核`,
    });
  }

  const unassignedZones = zones
    .filter((z) => !assignedZoneIds.has(z.id) && z.id !== "circulation")
    .map((z) => z.labelZh);

  const overallScore =
    assignments.length > 0
      ? Math.round(assignments.reduce((s, a) => s + a.fitScore, 0) / assignments.length)
      : 0;

  const suggestions: string[] = [];
  if (overallScore < 70) {
    suggestions.push("建议合并过小房间或拆除非承重隔墙以形成主功能空间");
  }
  if (unassignedZones.length > 0) {
    suggestions.push(`缺少专用空间：${unassignedZones.join("、")}，可考虑拆分或增建`);
  }
  const lowFit = assignments.filter((a) => a.fitScore < 55);
  if (lowFit.length > 0) {
    suggestions.push(`${lowFit.length} 个房间功能匹配度偏低，优先现场调研确认`);
  }
  if (overallScore >= 80) {
    suggestions.push("现有分区与目标功能整体匹配良好，可进入方案深化阶段");
  }

  return {
    targetFunction,
    totalArea: Math.round(totalArea * 10) / 10,
    assignments: assignments.sort((a, b) => b.area - a.area),
    overallScore,
    suggestions,
    unassignedZones,
  };
}
