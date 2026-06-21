import type { ProjectWithRelations, RenovationStrategy } from "@/types";
import { analyzeCirculation } from "@/lib/bim/circulation-analysis";
import { inferUnitScale } from "@/lib/bim/room-geometry";
import { computeSpatialRoomCosts } from "@/lib/bim/spatial-cost";
import type { BimModel, BimSpatialAnalytics } from "@/types/bim";

export function buildSpatialAnalytics(
  project: ProjectWithRelations,
  model: BimModel,
  strategy?: RenovationStrategy | null,
  options?: { fromRoomId?: string; toRoomId?: string }
): BimSpatialAnalytics | null {
  const rooms = model.metadata?.rooms ?? [];
  if (rooms.length === 0) return null;

  const unitScale =
    model.metadata?.unitScale ??
    inferUnitScale(model.metadata?.bounds, rooms);

  const circulation = analyzeCirculation(rooms, unitScale, options);
  const cost = computeSpatialRoomCosts(project, rooms, strategy);

  return {
    circulation,
    roomCosts: cost.roomCosts,
    estimatedCostPerSqm: cost.estimatedCostPerSqm,
    estimatedTotalCost: cost.estimatedTotalCost,
    currency: cost.currency,
  };
}
