import type { BimCirculationAnalysis, BimRoomInfo } from "@/types/bim";
import { analyzeCirculation } from "@/lib/bim/circulation-analysis";
import { roomsWithCentroids } from "@/lib/bim/room-geometry";

export interface FlowNodeMetrics {
  roomId: string;
  label: string;
  area: number;
  betweenness: number;
  estimatedPeakFlow: number;
  densityLevel: "low" | "medium" | "high" | "critical";
  isBottleneck: boolean;
}

export interface FlowSimulationResult {
  peakOccupancyEstimate: number;
  averagePathLength: number;
  bottleneckCount: number;
  nodes: FlowNodeMetrics[];
  hotspots: string[];
  recommendations: string[];
  unitScale: number;
}

const OCCUPANCY_LOAD: Record<string, number> = {
  exhibition: 0.8,
  gallery: 0.8,
  office: 0.12,
  meeting: 0.5,
  corridor: 0.3,
  lobby: 0.4,
  toilet: 0.15,
  kitchen: 0.2,
  storage: 0.02,
  展厅: 0.8,
  办公: 0.12,
  走廊: 0.3,
  门厅: 0.4,
  卫生间: 0.15,
};

function occupancyLoad(label: string): number {
  const lower = label.toLowerCase();
  for (const [key, load] of Object.entries(OCCUPANCY_LOAD)) {
    if (lower.includes(key.toLowerCase())) return load;
  }
  return 0.25;
}

function buildBetweenness(
  rooms: BimRoomInfo[],
  circulation: BimCirculationAnalysis
): Map<string, number> {
  const scores = new Map<string, number>();
  for (const room of rooms) scores.set(room.id, 0);

  const allPaths = [
    ...circulation.paths,
    ...(circulation.mainSpine ? [circulation.mainSpine] : []),
  ];

  for (const path of allPaths) {
    for (let i = 1; i < path.roomIds.length - 1; i++) {
      const id = path.roomIds[i];
      scores.set(id, (scores.get(id) ?? 0) + 1);
    }
  }

  const max = Math.max(...scores.values(), 1);
  for (const [id, val] of scores) {
    scores.set(id, val / max);
  }
  return scores;
}

export function simulatePedestrianFlow(
  rooms: BimRoomInfo[],
  unitScale = 1,
  options?: { fromRoomId?: string; toRoomId?: string }
): FlowSimulationResult {
  const circulation = analyzeCirculation(rooms, unitScale, options);
  const located = roomsWithCentroids(rooms, unitScale);
  const betweenness = buildBetweenness(rooms, circulation);

  const nodes: FlowNodeMetrics[] = located.map((room) => {
    const load = occupancyLoad(room.label);
    const peakFlow = Math.round(room.area * load);
    const bet = betweenness.get(room.id) ?? 0;
    const flowPressure = peakFlow * (1 + bet * 2);

    let densityLevel: FlowNodeMetrics["densityLevel"] = "low";
    if (flowPressure > room.area * 0.9) densityLevel = "critical";
    else if (flowPressure > room.area * 0.6) densityLevel = "high";
    else if (flowPressure > room.area * 0.35) densityLevel = "medium";

    const isBottleneck =
      bet >= 0.6 && (/corridor|hallway|走廊|通道|过厅/i.test(room.label) || room.area < 25);

    return {
      roomId: room.id,
      label: room.label,
      area: room.area,
      betweenness: Math.round(bet * 100) / 100,
      estimatedPeakFlow: peakFlow,
      densityLevel,
      isBottleneck,
    };
  });

  const bottlenecks = nodes.filter((n) => n.isBottleneck);
  const hotspots = nodes
    .filter((n) => n.densityLevel === "high" || n.densityLevel === "critical")
    .map((n) => n.label);

  const peakOccupancyEstimate = nodes.reduce((s, n) => s + n.estimatedPeakFlow, 0);
  const recommendations: string[] = [];

  if (bottlenecks.length > 0) {
    recommendations.push(
      `识别 ${bottlenecks.length} 处潜在瓶颈：${bottlenecks.map((b) => b.label).join("、")}，建议拓宽通道或调整入口动线`
    );
  }
  if (hotspots.length > 0) {
    recommendations.push(`高峰密度区域：${hotspots.slice(0, 4).join("、")}，需关注疏散宽度`);
  }
  if ((circulation.averagePathLength ?? 0) > 35) {
    recommendations.push("平均动线偏长，可考虑增设次级入口或优化功能分区以减少穿越距离");
  }
  if (bottlenecks.length === 0 && hotspots.length === 0) {
    recommendations.push("当前动线网络无明显拥堵风险，人流组织合理");
  }

  return {
    peakOccupancyEstimate,
    averagePathLength: circulation.averagePathLength ?? 0,
    bottleneckCount: bottlenecks.length,
    nodes: nodes.sort((a, b) => b.betweenness - a.betweenness),
    hotspots,
    recommendations,
    unitScale,
  };
}
