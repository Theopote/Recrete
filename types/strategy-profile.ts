import type { StrategyType } from "@/types";

export type StrategyTier = "light" | "medium" | "deep";

export type SpatialIntervention =
  | "retain"
  | "adapt"
  | "merge"
  | "subdivide"
  | "remove";

export interface StrategySpatialLink {
  nodeId: string;
  roomLabel: string;
  areaM2?: number;
  function?: string;
  intervention: SpatialIntervention;
  rationale: string;
}

export interface StrategyTierProfile {
  tier: StrategyTier;
  tierLabel: { en: string; zh: string };
  strategyType: StrategyType;
  interventionDepth: "minimal" | "selective" | "comprehensive";
  preservationPosture: string;
  phasedDelivery?: string;
  spatialSummary: string;
  structuralScope: string;
  envelopeScope: string;
  mepScope: string;
  spatialLinks: StrategySpatialLink[];
  diagnosisResponses: string[];
}

export const CORE_STRATEGY_TYPES = [
  "light_renewal",
  "medium_renovation",
  "deep_recreation",
] as const satisfies readonly StrategyType[];

export type CoreStrategyType = (typeof CORE_STRATEGY_TYPES)[number];

export const STRATEGY_TIER_META: Record<
  StrategyTier,
  {
    type: CoreStrategyType;
    aliases: StrategyType[];
    label: { en: string; zh: string };
    interventionDepth: StrategyTierProfile["interventionDepth"];
    preservationPosture: string;
  }
> = {
  light: {
    type: "light_renewal",
    aliases: ["light_renewal"],
    label: { en: "Light renewal", zh: "轻介入更新" },
    interventionDepth: "minimal",
    preservationPosture: "Retain layout and structure; localized upgrades only.",
  },
  medium: {
    type: "medium_renovation",
    aliases: ["medium_renovation", "adaptive_reuse"],
    label: { en: "Medium renovation", zh: "中度功能重组" },
    interventionDepth: "selective",
    preservationPosture: "Selective partition removal and spatial reconfiguration.",
  },
  deep: {
    type: "deep_recreation",
    aliases: ["deep_recreation"],
    label: { en: "Deep recreation", zh: "深度再造" },
    interventionDepth: "comprehensive",
    preservationPosture: "Major spatial transformation; structure/envelope may change.",
  },
};
