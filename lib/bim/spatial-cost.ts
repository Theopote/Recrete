import type { ProjectWithRelations, RenovationStrategy, StrategyType } from "@/types";
import { estimateProjectCost } from "@/lib/ai/agents/cost-estimator-agent";
import type { BimRoomCostCell, BimRoomInfo } from "@/types/bim";

const STRATEGY_MULTIPLIER: Record<StrategyType, number> = {
  light_renewal: 0.85,
  medium_renovation: 1,
  deep_recreation: 1.35,
  adaptive_reuse: 1.05,
  facade_upgrade: 0.95,
  energy_retrofit: 1.08,
  safety_upgrade: 1.12,
};

const FUNCTION_MULTIPLIER: Record<string, number> = {
  corridor: 0.75,
  toilet: 1.15,
  bathroom: 1.15,
  kitchen: 1.25,
  server: 1.4,
  mechanical: 1.35,
  lobby: 1.05,
  office: 1,
  meeting: 1.08,
  storage: 0.7,
  走廊: 0.75,
  卫生间: 1.15,
  厨房: 1.25,
  机房: 1.4,
  大堂: 1.05,
};

function roomFunctionMultiplier(label: string, layer?: string) {
  const text = `${label} ${layer ?? ""}`.toLowerCase();
  for (const [keyword, multiplier] of Object.entries(FUNCTION_MULTIPLIER)) {
    if (text.includes(keyword.toLowerCase())) return multiplier;
  }
  return 1;
}

export function strategyImpactScore(strategy?: RenovationStrategy | null) {
  if (!strategy) return 0.5;
  const typeImpact = STRATEGY_MULTIPLIER[strategy.type] ?? 1;
  const costImpact =
    strategy.costLevel === "high" ? 1.2 : strategy.costLevel === "low" ? 0.85 : 1;
  const riskImpact =
    strategy.riskLevel === "high" || strategy.riskLevel === "critical"
      ? 1.15
      : strategy.riskLevel === "low"
        ? 0.9
        : 1;
  return Math.min(1, (typeImpact * costImpact * riskImpact - 0.7) / 0.8);
}

export function computeSpatialRoomCosts(
  project: ProjectWithRelations,
  rooms: BimRoomInfo[],
  strategy?: RenovationStrategy | null
): {
  roomCosts: BimRoomCostCell[];
  estimatedCostPerSqm: number;
  estimatedTotalCost: number;
  currency: "CNY";
} {
  const estimate = estimateProjectCost(project, strategy, {
    strategyType: strategy?.type,
  });
  const totalArea = rooms.reduce((sum, room) => sum + room.area, 0) || project.grossFloorArea || 1;
  const strategyImpact = strategyImpactScore(strategy);

  const weighted = rooms.map((room) => {
    const functionMultiplier = roomFunctionMultiplier(room.label, room.layer);
    const weight = room.area * functionMultiplier;
    return { room, weight, functionMultiplier };
  });

  const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0) || totalArea;
  const roomCosts = weighted.map(({ room, weight, functionMultiplier }) => {
    const share = weight / totalWeight;
    const totalCost = Math.round(estimate.estimatedTotalCost * share);
    const costPerSqm = Math.round(totalCost / Math.max(room.area, 0.01));
    const intensity = Math.min(1, costPerSqm / (estimate.estimatedCostPerSqm * 1.6));
    const strategyRoomImpact = Math.min(
      1,
      intensity * 0.6 + strategyImpact * 0.4 * functionMultiplier * 0.8
    );

    return {
      roomId: room.id,
      label: room.label,
      area: room.area,
      costPerSqm,
      totalCost,
      intensity,
      strategyImpact: Math.round(strategyRoomImpact * 100) / 100,
    };
  });

  return {
    roomCosts: roomCosts.sort((a, b) => b.totalCost - a.totalCost),
    estimatedCostPerSqm: estimate.estimatedCostPerSqm,
    estimatedTotalCost: estimate.estimatedTotalCost,
    currency: "CNY",
  };
}

export function costHeatColor(intensity: number) {
  const clamped = Math.max(0, Math.min(1, intensity));
  const hue = 220 - clamped * 220;
  return `hsla(${hue}, 82%, 52%, 0.55)`;
}

export function impactHeatColor(intensity: number) {
  const clamped = Math.max(0, Math.min(1, intensity));
  const hue = 130 - clamped * 130;
  return `hsla(${hue}, 78%, 46%, 0.58)`;
}
