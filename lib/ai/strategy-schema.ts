import type { DiagnosisItem, RenovationStrategy, StrategyWithMetrics } from "@/types";
import type {
  StrategySpatialLink,
  StrategyTier,
  StrategyTierProfile,
} from "@/types/strategy-profile";
import {
  CORE_STRATEGY_TYPES,
  STRATEGY_TIER_META,
} from "@/types/strategy-profile";
import type { DrawingKnowledgeGraph } from "@/lib/ai/knowledge/drawing-knowledge-graph";
import { linkStrategySpatialPlan } from "@/lib/ai/strategy-drawing-linker";

type StrategyDraft = Omit<
  RenovationStrategy,
  "id" | "projectId" | "createdAt" | "updatedAt"
>;

const TIER_ORDER: StrategyTier[] = ["light", "medium", "deep"];

function scoreStrategyForTier(strategy: StrategyDraft, tier: StrategyTier): number {
  const meta = STRATEGY_TIER_META[tier];
  if (meta.aliases.includes(strategy.type)) return 100;
  if (tier === "medium" && strategy.type === "adaptive_reuse") return 95;
  return 0;
}

export function normalizeStrategyBatch(strategies: StrategyDraft[]): StrategyDraft[] {
  const remaining = [...strategies];
  const picked: StrategyDraft[] = [];

  for (const tier of TIER_ORDER) {
    const meta = STRATEGY_TIER_META[tier];
    let bestIndex = -1;
    let bestScore = -1;

    for (let index = 0; index < remaining.length; index++) {
      const score = scoreStrategyForTier(remaining[index], tier);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    }

    const selected =
      bestIndex >= 0 ? remaining.splice(bestIndex, 1)[0]! : synthesizeFallbackStrategy(tier);

    picked.push({
      ...selected,
      type: meta.type,
      name: selected.name || `${meta.label.en} — ${meta.label.zh}`,
    });
  }

  return picked;
}

function synthesizeFallbackStrategy(tier: StrategyTier): StrategyDraft {
  const meta = STRATEGY_TIER_META[tier];
  return {
    name: `${meta.label.en} — ${meta.label.zh}`,
    type: meta.type,
    summary: `${meta.label.en} strategy placeholder — regenerate for project-specific content.`,
    designGoal: "Meet renovation goals within this intervention depth.",
    spatialStrategy: "To be defined from drawing graph and diagnosis.",
    structuralStrategy: "Scope aligned with intervention depth.",
    facadeStrategy: "Envelope work scaled to tier.",
    mepStrategy: "MEP scope scaled to tier.",
    costLevel: tier === "light" ? "low" : tier === "medium" ? "medium" : "high",
    scheduleLevel: tier === "light" ? "low" : tier === "medium" ? "medium" : "high",
    riskLevel: tier === "light" ? "low" : tier === "medium" ? "medium" : "high",
    pros: ["Aligned to intervention tier"],
    cons: ["Requires regeneration for project-specific detail"],
    recommendationReason: null,
  };
}

function inferDiagnosisResponses(
  strategy: StrategyDraft,
  diagnosis: DiagnosisItem[] = []
): string[] {
  const haystack = [
    strategy.summary,
    strategy.spatialStrategy,
    strategy.structuralStrategy,
    strategy.facadeStrategy,
    strategy.mepStrategy,
  ]
    .join(" ")
    .toLowerCase();

  return diagnosis
    .filter((item) => {
      const title = item.title.toLowerCase();
      const category = item.category.toLowerCase();
      return haystack.includes(title.slice(0, 12)) || haystack.includes(category);
    })
    .slice(0, 4)
    .map((item) => `${item.title} → ${item.recommendation ?? item.description.slice(0, 80)}`);
}

export function buildStrategyTierProfile(
  strategy: RenovationStrategy | StrategyDraft,
  tier: StrategyTier,
  options?: {
    spatialLinks?: StrategySpatialLink[];
    diagnosis?: DiagnosisItem[];
  }
): StrategyTierProfile {
  const meta = STRATEGY_TIER_META[tier];
  return {
    tier,
    tierLabel: meta.label,
    strategyType: meta.type,
    interventionDepth: meta.interventionDepth,
    preservationPosture: meta.preservationPosture,
    phasedDelivery:
      tier === "light"
        ? "Single phase; prioritize code-critical zones."
        : tier === "medium"
          ? "Two phases: shell/MEP then interior fit-out."
          : "Multi-phase with structural/envelope then interior.",
    spatialSummary: strategy.spatialStrategy,
    structuralScope: strategy.structuralStrategy,
    envelopeScope: strategy.facadeStrategy,
    mepScope: strategy.mepStrategy,
    spatialLinks: options?.spatialLinks ?? [],
    diagnosisResponses: inferDiagnosisResponses(strategy, options?.diagnosis),
  };
}

export function enrichStrategiesWithProfiles(
  strategies: StrategyWithMetrics[],
  options?: {
    drawingGraph?: DrawingKnowledgeGraph | null;
    diagnosis?: DiagnosisItem[];
  }
): StrategyWithMetrics[] {
  if (strategies.length === 0) return strategies;

  const drafts = strategies.map(
    ({
      id: _id,
      projectId: _projectId,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      metrics: _metrics,
      rank: _rank,
      compositeScore: _compositeScore,
      areaFitScore: _areaFitScore,
      scoreBreakdown: _scoreBreakdown,
      scoreContributions: _scoreContributions,
      scoreWeights: _scoreWeights,
      rankSummary: _rankSummary,
      lifecycleBonus: _lifecycleBonus,
      tierProfile: _tierProfile,
      linkedGraphNodeIds: _linkedGraphNodeIds,
      ...draft
    }) => draft
  );

  const normalized = normalizeStrategyBatch(drafts);

  return TIER_ORDER.map((tier, index) => {
    const meta = STRATEGY_TIER_META[tier];
    const existing =
      strategies.find((strategy) => meta.aliases.includes(strategy.type)) ??
      strategies[index];
    const draft = normalized[index]!;

    const merged: StrategyWithMetrics = {
      ...(existing ?? {
        id: `tier-${tier}`,
        projectId: "",
        createdAt: new Date(),
        updatedAt: new Date(),
        metrics: strategies[0]?.metrics ?? {
          cost: 50,
          schedule: 50,
          risk: 50,
          designValue: 50,
          constructionDifficulty: 50,
          preservationLevel: 50,
          feasibility: 50,
          lifecycleCost: 50,
        },
      }),
      ...draft,
      type: meta.type,
    };

    const spatialLinks = linkStrategySpatialPlan(merged, tier, options?.drawingGraph ?? null);
    const tierProfile = buildStrategyTierProfile(merged, tier, {
      spatialLinks,
      diagnosis: options?.diagnosis,
    });

    return {
      ...merged,
      spatialStrategy: mergeSpatialNarrative(merged.spatialStrategy, spatialLinks),
      tierProfile,
      linkedGraphNodeIds: spatialLinks.map((link) => link.nodeId),
    };
  });
}

function mergeSpatialNarrative(
  base: string,
  links: StrategySpatialLink[]
): string {
  if (links.length === 0) return base;
  const roomLine = links
    .slice(0, 4)
    .map((link) => `${link.roomLabel} (${link.intervention})`)
    .join("; ");
  if (base.toLowerCase().includes(links[0]?.roomLabel.toLowerCase().slice(0, 4) ?? "")) {
    return base;
  }
  return `${base} Drawing-linked rooms: ${roomLine}.`;
}

export function formatDrawingGraphSection(graph: DrawingKnowledgeGraph | null): string {
  if (!graph || graph.nodes.length === 0) {
    return "## Drawing Knowledge Graph\nNo parsed floor-plan rooms yet — infer layout from documents.";
  }

  const rooms = graph.nodes
    .filter((node) => node.type === "room")
    .slice(0, 12)
    .map((node, index) => {
      const props = node.properties as {
        area?: number;
        function?: string;
        dimensions?: { width?: number; height?: number };
      };
      const dims =
        props.dimensions?.width && props.dimensions?.height
          ? `${props.dimensions.width}×${props.dimensions.height} m`
          : "—";
      return `${index + 1}. **${node.label}** — ${props.area ?? "?"} m², ${props.function ?? "unknown"}, dims ${dims}`;
    });

  const structural = graph.nodes
    .filter((node) => node.type === "structural_element")
    .slice(0, 6)
    .map((node) => node.label);

  const annotations = graph.nodes
    .filter((node) => node.type === "annotation")
    .slice(0, 5)
    .map((node) => node.label);

  return [
    "## Drawing Knowledge Graph (use for spatialStrategy room references)",
    `Sheets merged: ${graph.documentName}; nodes: ${graph.nodes.length}`,
    rooms.length > 0 ? `### Rooms\n${rooms.join("\n")}` : "",
    structural.length > 0 ? `### Structural elements\n${structural.join("; ")}` : "",
    annotations.length > 0 ? `### Annotations\n${annotations.join("; ")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}
