import type { BimModel, BimRoomInfo } from "@/types/bim";

/**
 * Mock BIM room sets for elevator feasibility testing.
 *
 * Usage:
 * - Unit tests: import { ELEVATOR_BIM_MOCK_SCENARIOS, getElevatorMockRooms } from this file
 * - Manual API test: POST /api/projects/:id/experts/elevator with body { "mockScenario": "feasible" }
 */

export type ElevatorBimMockScenario =
  | "feasible"
  | "heritage"
  | "infeasible"
  | "multi_candidate"
  | "empty";

export interface ElevatorBimMockScenarioMeta {
  id: ElevatorBimMockScenario;
  labelEn: string;
  labelZh: string;
  descriptionEn: string;
  descriptionZh: string;
  expectedVerdict: "feasible" | "conditional" | "infeasible" | "insufficient_data";
}

export const ELEVATOR_BIM_MOCK_SCENARIO_META: Record<
  ElevatorBimMockScenario,
  ElevatorBimMockScenarioMeta
> = {
  feasible: {
    id: "feasible",
    labelEn: "Feasible — southeast storage shaft",
    labelZh: "可行 — 东南角储藏间井道",
    descriptionEn:
      "3F plan with 2.4×2.3m storage room; should yield feasible/conditional verdict.",
    descriptionZh: "三层平面含 2.4×2.3m 储藏间，预期可行或条件可行。",
    expectedVerdict: "conditional",
  },
  heritage: {
    id: "heritage",
    labelEn: "Heritage — same layout, district protection",
    labelZh: "文保 — 同布局区级保护",
    descriptionEn: "Same rooms as feasible; pair with heritageLevel district for heritageFlag.",
    descriptionZh: "与可行场景相同房间；配合区级文保等级触发 heritageFlag。",
    expectedVerdict: "conditional",
  },
  infeasible: {
    id: "infeasible",
    labelEn: "Infeasible — undersized candidates only",
    labelZh: "不可行 — 仅过小候选空间",
    descriptionEn: "Small storage + excluded toilet; no shaft meets minimum dimensions.",
    descriptionZh: "过小储藏间与卫生间；无满足最小井道尺寸的空间。",
    expectedVerdict: "infeasible",
  },
  multi_candidate: {
    id: "multi_candidate",
    labelEn: "Multi-candidate — stair vs storage ranking",
    labelZh: "多候选 — 楼梯间与储藏间排序",
    descriptionEn: "Stair core and storage; tests candidate finder sort order.",
    descriptionZh: "含楼梯间与储藏间，用于测试候选空间排序。",
    expectedVerdict: "conditional",
  },
  empty: {
    id: "empty",
    labelEn: "No BIM data",
    labelZh: "无 BIM 数据",
    descriptionEn: "Empty room list; should return insufficient_data.",
    descriptionZh: "空房间列表，预期返回数据不足。",
    expectedVerdict: "insufficient_data",
  },
};

function rectPolygon(
  originX: number,
  originY: number,
  width: number,
  depth: number
): BimRoomInfo["polygon"] {
  return [
    { x: originX, y: originY },
    { x: originX + width, y: originY },
    { x: originX + width, y: originY + depth },
    { x: originX, y: originY + depth },
  ];
}

function mockRoom(
  id: string,
  label: string,
  width: number,
  depth: number,
  originX = 0,
  originY = 0,
  source: BimRoomInfo["source"] = "cad_polyline"
): BimRoomInfo {
  const area = Math.round(width * depth * 100) / 100;
  const cx = originX + width / 2;
  const cy = originY + depth / 2;
  return {
    id,
    label,
    area,
    areaUnit: "m2",
    source,
    polygon: rectPolygon(originX, originY, width, depth),
    centroid: { x: cx, y: cy },
  };
}

/** Standard 3F residential/office floor — task-book example layout */
export const MOCK_ELEVATOR_FLOOR_FEASIBLE: BimRoomInfo[] = [
  mockRoom("rm-corridor", "主走廊", 12, 2.4, 0, 10),
  mockRoom("rm-stair", "疏散楼梯间", 2.0, 2.5, 12, 8),
  mockRoom("rm-storage-se", "三层东南角储藏间", 2.4, 2.3, 14, 0),
  mockRoom("rm-office-nw", "北向办公室", 6.5, 7.0, 0, 0),
  mockRoom("rm-meeting", "会议室", 5.2, 6.3, 7, 0),
  mockRoom("rm-toilet", "卫生间", 3.0, 2.8, 12, 0),
  mockRoom("rm-mech", "弱电机房", 4.0, 3.5, 0, 14),
];

/** Only undersized or excluded spaces */
export const MOCK_ELEVATOR_FLOOR_INFEASIBLE: BimRoomInfo[] = [
  mockRoom("rm-storage-tiny", "储藏间", 1.4, 1.3, 0, 0),
  mockRoom("rm-storage-closet", "杂物储藏", 1.6, 1.2, 2, 0),
  mockRoom("rm-toilet-a", "卫生间 A", 3.0, 3.0, 5, 0),
  mockRoom("rm-toilet-b", "卫生间 B", 2.8, 2.5, 9, 0),
  mockRoom("rm-office-large", "大办公室", 8.0, 9.0, 0, 5),
  mockRoom("rm-kitchen", "厨房", 4.5, 3.8, 9, 5),
];

/** Stair + two storage options — tests ranking by min side */
export const MOCK_ELEVATOR_FLOOR_MULTI: BimRoomInfo[] = [
  mockRoom("rm-stair-core", "楼梯间", 2.0, 2.5, 0, 0),
  mockRoom("rm-storage-a", "储藏间 A", 2.1, 2.0, 3, 0),
  mockRoom("rm-storage-b", "东南角储藏间", 2.4, 2.3, 6, 0),
  mockRoom("rm-void-shaft", "设备井道", 1.8, 2.2, 9, 0),
  mockRoom("rm-corridor", "走廊", 10, 2.0, 0, 3),
];

export const ELEVATOR_BIM_MOCK_SCENARIOS: Record<ElevatorBimMockScenario, BimRoomInfo[]> = {
  feasible: MOCK_ELEVATOR_FLOOR_FEASIBLE,
  heritage: MOCK_ELEVATOR_FLOOR_FEASIBLE,
  infeasible: MOCK_ELEVATOR_FLOOR_INFEASIBLE,
  multi_candidate: MOCK_ELEVATOR_FLOOR_MULTI,
  empty: [],
};

export function getElevatorMockRooms(scenario: ElevatorBimMockScenario): BimRoomInfo[] {
  return ELEVATOR_BIM_MOCK_SCENARIOS[scenario] ?? [];
}

export function isElevatorBimMockScenario(value: unknown): value is ElevatorBimMockScenario {
  return (
    typeof value === "string" &&
    value in ELEVATOR_BIM_MOCK_SCENARIOS
  );
}

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);

/** Full BimModel fixture with rooms embedded in metadata */
export function createElevatorMockBimModel(
  projectId: string,
  scenario: ElevatorBimMockScenario
): BimModel {
  const rooms = getElevatorMockRooms(scenario);
  const totalArea = rooms.reduce((sum, r) => sum + r.area, 0);
  return {
    id: `bim-mock-elevator-${scenario}`,
    projectId,
    name: `Mock floor plan (${scenario})`,
    format: "dwg",
    status: "ready",
    fileUrl: `/mock/bim/elevator-${scenario}.dwg`,
    fileSize: 128000,
    mimeType: "application/acad",
    metadata: {
      rooms,
      totalArea,
      totalAreaUnit: "m2",
      unitScale: 1,
      bounds: { minX: 0, minY: 0, maxX: 20, maxY: 18 },
    },
    uploadedById: "user-1",
    createdAt: daysAgo(7),
    updatedAt: daysAgo(1),
  };
}

/** Convenience: top candidate from feasible scenario (task-book example room) */
export const MOCK_ELEVATOR_BEST_CANDIDATE = MOCK_ELEVATOR_FLOOR_FEASIBLE.find((r) =>
  r.label.includes("储藏")
)!;

/** Convenience: smallest candidate from infeasible scenario */
export const MOCK_ELEVATOR_TOO_SMALL_CANDIDATE = MOCK_ELEVATOR_FLOOR_INFEASIBLE.find((r) =>
  r.label.includes("储藏")
)!;
