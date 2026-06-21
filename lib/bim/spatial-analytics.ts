import type { ProjectWithRelations, RenovationStrategy } from "@/types";
import { analyzeCirculation } from "@/lib/bim/circulation-analysis";
import { simulatePedestrianFlow } from "@/lib/bim/flow-simulation";
import { planFurnitureLayout } from "@/lib/bim/furniture-planner";
import { optimizeFunctionalLayout } from "@/lib/bim/layout-optimizer";
import { inferUnitScale } from "@/lib/bim/room-geometry";
import { computeSpatialRoomCosts } from "@/lib/bim/spatial-cost";
import type { BimModel, BimSpatialAnalytics } from "@/types/bim";

export function buildSpatialAnalytics(
  project: ProjectWithRelations,
  model: BimModel,
  strategy?: RenovationStrategy | null,
  options?: {
    fromRoomId?: string;
    toRoomId?: string;
    includeLayout?: boolean;
    includeFlow?: boolean;
    includeFurniture?: boolean;
  }
): BimSpatialAnalytics | null {
  const rooms = model.metadata?.rooms ?? [];
  if (rooms.length === 0) return null;

  const unitScale =
    model.metadata?.unitScale ??
    inferUnitScale(model.metadata?.bounds, rooms);

  const circulation = analyzeCirculation(rooms, unitScale, options);
  const cost = computeSpatialRoomCosts(project, rooms, strategy);

  const targetFunction = strategy?.designGoal
    ? `${project.targetFunction} — ${strategy.designGoal.slice(0, 80)}`
    : project.targetFunction;

  const layout =
    options?.includeLayout !== false
      ? optimizeFunctionalLayout(rooms, targetFunction, unitScale)
      : undefined;

  const flow =
    options?.includeFlow !== false
      ? simulatePedestrianFlow(rooms, unitScale, options)
      : undefined;

  const furniture =
    options?.includeFurniture !== false && layout
      ? planFurnitureLayout(rooms, layout.assignments, unitScale)
      : undefined;

  return {
    circulation,
    roomCosts: cost.roomCosts,
    estimatedCostPerSqm: cost.estimatedCostPerSqm,
    estimatedTotalCost: cost.estimatedTotalCost,
    currency: cost.currency,
    layout,
    flow,
    furniture,
  };
}
