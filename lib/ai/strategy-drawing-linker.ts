import type { RenovationStrategy } from "@/types";
import type { SpatialIntervention, StrategySpatialLink, StrategyTier } from "@/types/strategy-profile";
import type { DrawingKnowledgeGraph, GraphNode } from "@/lib/ai/knowledge/drawing-knowledge-graph";

const INTERVENTION_LABELS: Record<SpatialIntervention, { en: string; zh: string }> = {
  retain: { en: "retain layout", zh: "保留" },
  adapt: { en: "adapt for new program", zh: "改造适配" },
  merge: { en: "merge into open zone", zh: "合并开放" },
  subdivide: { en: "subdivide for program", zh: "细分重组" },
  remove: { en: "remove partition", zh: "拆除隔断" },
};

function roomNodes(graph: DrawingKnowledgeGraph | null): GraphNode[] {
  if (!graph) return [];
  return graph.nodes.filter((node) => node.type === "room");
}

function roomProperties(node: GraphNode) {
  return node.properties as {
    area?: number;
    function?: string;
  };
}

function textMentionsRoom(text: string, node: GraphNode): boolean {
  const lower = text.toLowerCase();
  const labelParts = node.label
    .split(/[\s/·,，]+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2);

  if (labelParts.some((part) => lower.includes(part.toLowerCase()))) return true;

  const fn = roomProperties(node).function;
  if (fn && fn.length >= 4 && lower.includes(fn.toLowerCase())) return true;

  const id = node.id.split(":").pop();
  if (id && lower.includes(id.toLowerCase())) return true;

  return false;
}

function defaultIntervention(
  tier: StrategyTier,
  roomFunction?: string
): SpatialIntervention {
  const fn = roomFunction?.toLowerCase() ?? "";
  if (fn.includes("circulation") || fn.includes("stair") || fn.includes("corridor")) {
    return "retain";
  }

  switch (tier) {
    case "light":
      return fn.includes("office") || fn.includes("meeting") ? "adapt" : "retain";
    case "medium":
      return fn.includes("office") || fn.includes("meeting") ? "merge" : "adapt";
    case "deep":
      return fn.includes("office") ? "subdivide" : fn.includes("meeting") ? "merge" : "adapt";
    default:
      return "adapt";
  }
}

function rationaleForIntervention(
  tier: StrategyTier,
  intervention: SpatialIntervention,
  roomLabel: string
): string {
  const tierLabel =
    tier === "light" ? "Light tier" : tier === "medium" ? "Medium tier" : "Deep tier";
  return `${tierLabel}: ${INTERVENTION_LABELS[intervention].en} for ${roomLabel}.`;
}

export function linkStrategySpatialPlan(
  strategy: Pick<RenovationStrategy, "spatialStrategy" | "designGoal" | "summary">,
  tier: StrategyTier,
  graph: DrawingKnowledgeGraph | null
): StrategySpatialLink[] {
  const rooms = roomNodes(graph);
  if (rooms.length === 0) return [];

  const text = `${strategy.spatialStrategy} ${strategy.designGoal} ${strategy.summary}`;
  const links: StrategySpatialLink[] = [];

  for (const node of rooms) {
    const props = roomProperties(node);
    const mentioned = textMentionsRoom(text, node);
    const intervention = mentioned
      ? inferInterventionFromText(text, tier, props.function)
      : defaultIntervention(tier, props.function);

    if (!mentioned && intervention === "retain" && tier !== "light") {
      continue;
    }

    links.push({
      nodeId: node.id,
      roomLabel: node.label,
      areaM2: props.area,
      function: props.function,
      intervention,
      rationale: rationaleForIntervention(tier, intervention, node.label),
    });
  }

  if (links.length === 0) {
    return rooms.slice(0, 3).map((node) => {
      const props = roomProperties(node);
      const intervention = defaultIntervention(tier, props.function);
      return {
        nodeId: node.id,
        roomLabel: node.label,
        areaM2: props.area,
        function: props.function,
        intervention,
        rationale: rationaleForIntervention(tier, intervention, node.label),
      };
    });
  }

  return links.sort((a, b) => (b.areaM2 ?? 0) - (a.areaM2 ?? 0));
}

function inferInterventionFromText(
  text: string,
  tier: StrategyTier,
  roomFunction?: string
): SpatialIntervention {
  const lower = text.toLowerCase();
  if (/remove|demolish|拆除|移除/.test(lower)) return tier === "light" ? "adapt" : "remove";
  if (/merge|open plan|合并|开放/.test(lower)) return "merge";
  if (/subdivide|partition|细分|分隔/.test(lower)) return "subdivide";
  if (/retain|preserve|保留|维持/.test(lower)) return "retain";
  return defaultIntervention(tier, roomFunction);
}

export { INTERVENTION_LABELS };
