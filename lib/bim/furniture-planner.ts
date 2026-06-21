import type { BimPoint2D, BimRoomInfo } from "@/types/bim";
import type { RoomFunctionAssignment } from "@/lib/bim/layout-optimizer";
import { roomsWithCentroids } from "@/lib/bim/room-geometry";

export interface FurnitureItem {
  id: string;
  name: string;
  nameZh: string;
  category: string;
  width: number;
  depth: number;
  unit: "m";
  position?: BimPoint2D;
  rotation?: number;
  note?: string;
}

export interface RoomFurniturePlan {
  roomId: string;
  roomLabel: string;
  area: number;
  functionType: string;
  items: FurnitureItem[];
  utilizationRate: number;
  clearanceNote: string;
}

export interface FurniturePlanningResult {
  plans: RoomFurniturePlan[];
  totalItems: number;
  averageUtilization: number;
  globalNotes: string[];
}

interface FurnitureTemplate {
  name: string;
  nameZh: string;
  category: string;
  width: number;
  depth: number;
  minArea: number;
  countFn: (area: number) => number;
}

const TEMPLATES: Record<string, FurnitureTemplate[]> = {
  exhibition: [
    { name: "Display Panel", nameZh: "展墙/展板", category: "display", width: 1.2, depth: 0.1, minArea: 20, countFn: (a) => Math.max(2, Math.floor(a / 25)) },
    { name: "Pedestal", nameZh: "展台", category: "display", width: 0.8, depth: 0.8, minArea: 15, countFn: (a) => Math.max(1, Math.floor(a / 30)) },
    { name: "Bench", nameZh: "休息座椅", category: "seating", width: 1.8, depth: 0.5, minArea: 40, countFn: (a) => Math.max(1, Math.floor(a / 50)) },
  ],
  gathering: [
    { name: "Folding Chair", nameZh: "折叠椅", category: "seating", width: 0.45, depth: 0.45, minArea: 30, countFn: (a) => Math.floor(a / 1.5) },
    { name: "Stage Platform", nameZh: "小型舞台", category: "stage", width: 3, depth: 2, minArea: 60, countFn: () => 1 },
    { name: "AV Cart", nameZh: "视听设备车", category: "equipment", width: 0.6, depth: 0.5, minArea: 40, countFn: () => 1 },
  ],
  office: [
    { name: "Workstation", nameZh: "工位", category: "desk", width: 1.4, depth: 0.7, minArea: 8, countFn: (a) => Math.max(1, Math.floor(a / 6)) },
    { name: "Meeting Table", nameZh: "会议桌", category: "table", width: 2.4, depth: 1.2, minArea: 15, countFn: (a) => (a >= 15 ? 1 : 0) },
    { name: "Storage Cabinet", nameZh: "文件柜", category: "storage", width: 0.9, depth: 0.4, minArea: 10, countFn: (a) => Math.max(1, Math.floor(a / 20)) },
  ],
  workshop: [
    { name: "Work Table", nameZh: "工作桌", category: "table", width: 1.8, depth: 0.9, minArea: 15, countFn: (a) => Math.max(1, Math.floor(a / 12)) },
    { name: "Tool Shelf", nameZh: "工具架", category: "storage", width: 1.2, depth: 0.4, minArea: 10, countFn: () => 1 },
  ],
  service: [
    { name: "Vanity Unit", nameZh: "洗手台", category: "fixture", width: 0.6, depth: 0.5, minArea: 3, countFn: (a) => Math.max(1, Math.floor(a / 4)) },
  ],
  default: [
    { name: "Flexible Table", nameZh: "灵活桌椅", category: "table", width: 1.2, depth: 0.6, minArea: 10, countFn: (a) => Math.max(1, Math.floor(a / 8)) },
    { name: "Chair", nameZh: "座椅", category: "seating", width: 0.5, depth: 0.5, minArea: 10, countFn: (a) => Math.max(2, Math.floor(a / 4)) },
  ],
};

function resolveTemplateKey(functionLabel: string): string {
  const lower = functionLabel.toLowerCase();
  if (/exhibition|gallery|展览|展示/.test(lower)) return "exhibition";
  if (/gathering|multipurpose|集会|多功能|讲堂/.test(lower)) return "gathering";
  if (/office|办公|meeting|会议/.test(lower)) return "office";
  if (/workshop|studio|工作坊|工作室/.test(lower)) return "workshop";
  if (/service|toilet|kitchen|卫生间|厨房|服务/.test(lower)) return "service";
  return "default";
}

function placeItemsInRoom(
  room: BimRoomInfo & { centroid: BimPoint2D },
  items: FurnitureItem[]
): FurnitureItem[] {
  const cols = Math.ceil(Math.sqrt(items.length));
  const spacing = 1.2;
  const startX = room.centroid.x - ((cols - 1) * spacing) / 2;
  const startY = room.centroid.y - spacing / 2;

  return items.map((item, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    return {
      ...item,
      position: {
        x: Math.round((startX + col * spacing) * 100) / 100,
        y: Math.round((startY + row * spacing) * 100) / 100,
      },
      rotation: 0,
    };
  });
}

export function planFurnitureLayout(
  rooms: BimRoomInfo[],
  assignments: RoomFunctionAssignment[],
  unitScale = 1
): FurniturePlanningResult {
  const located = roomsWithCentroids(rooms, unitScale);
  const assignmentMap = new Map(assignments.map((a) => [a.roomId, a]));
  const plans: RoomFurniturePlan[] = [];
  const globalNotes: string[] = [];

  for (const room of located) {
    if (room.area < 6) continue;

    const assignment = assignmentMap.get(room.id);
    const functionLabel = assignment?.assignedFunction ?? room.label;
    const templateKey = resolveTemplateKey(functionLabel);
    const templates = TEMPLATES[templateKey] ?? TEMPLATES.default;

    const items: FurnitureItem[] = [];
    let furnitureArea = 0;

    for (const tpl of templates) {
      if (room.area < tpl.minArea) continue;
      const count = tpl.countFn(room.area);
      for (let i = 0; i < count; i++) {
        items.push({
          id: `${room.id}-${tpl.category}-${i}`,
          name: tpl.name,
          nameZh: tpl.nameZh,
          category: tpl.category,
          width: tpl.width,
          depth: tpl.depth,
          unit: "m",
          note: i === 0 ? `建议沿墙或居中布置，留出不小于 1.2m 主通道` : undefined,
        });
        furnitureArea += tpl.width * tpl.depth;
      }
    }

    if (items.length === 0) continue;

    const placed = placeItemsInRoom(room, items);
    const utilizationRate = Math.min(100, Math.round((furnitureArea / Math.max(room.area, 1)) * 100));

    plans.push({
      roomId: room.id,
      roomLabel: room.label,
      area: room.area,
      functionType: assignment?.assignedFunctionZh ?? functionLabel,
      items: placed,
      utilizationRate,
      clearanceNote:
        utilizationRate > 45
          ? "家具密度偏高，建议减少数量或选用可折叠/可移动家具"
          : "预留 1.2m 以上主通道，符合基本疏散要求",
    });
  }

  if (plans.some((p) => p.utilizationRate > 45)) {
    globalNotes.push("部分房间家具占有率超过 45%，高峰使用时段可能影响通行");
  }
  globalNotes.push("布置方案为算法建议，需结合门窗位置、结构柱网现场调整");

  const totalItems = plans.reduce((s, p) => s + p.items.length, 0);
  const averageUtilization =
    plans.length > 0
      ? Math.round(plans.reduce((s, p) => s + p.utilizationRate, 0) / plans.length)
      : 0;

  return {
    plans: plans.sort((a, b) => b.area - a.area),
    totalItems,
    averageUtilization,
    globalNotes,
  };
}
