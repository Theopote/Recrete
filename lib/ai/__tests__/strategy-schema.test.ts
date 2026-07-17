import { describe, expect, it } from "vitest";
import { buildDrawingKnowledgeGraph } from "@/lib/ai/knowledge/drawing-knowledge-graph";
import { linkStrategySpatialPlan } from "@/lib/ai/strategy-drawing-linker";
import {
  enrichStrategiesWithProfiles,
  normalizeStrategyBatch,
} from "@/lib/ai/strategy-schema";
import type { RenovationStrategy, StrategyWithMetrics } from "@/types";

const graph = buildDrawingKnowledgeGraph(
  "proj-demo",
  "doc-1",
  "Floor Plan",
  {
    drawingType: "floor_plan",
    scale: "1:100",
    orientation: "North up",
    rooms: [
      {
        id: "R101",
        label: "办公室 Office",
        area: 45.2,
        function: "office",
        location: { x: 0, y: 0, width: 10, height: 10 },
      },
      {
        id: "R102",
        label: "会议室 Meeting Room",
        area: 32.8,
        function: "meeting",
        location: { x: 10, y: 0, width: 10, height: 10 },
      },
      {
        id: "R103",
        label: "走廊 Corridor",
        area: 18.5,
        function: "circulation",
        location: { x: 20, y: 0, width: 5, height: 10 },
      },
    ],
    dimensions: [],
    annotations: [],
    structuralElements: [],
    extractedText: [],
    confidence: 0.9,
    summary: "Test plan",
  }
);

function draft(partial: Partial<RenovationStrategy> & Pick<RenovationStrategy, "type" | "name">) {
  return {
    summary: "Summary",
    designGoal: "Goal",
    spatialStrategy: "Spatial",
    structuralStrategy: "Structure",
    facadeStrategy: "Facade",
    mepStrategy: "MEP",
    costLevel: "medium" as const,
    scheduleLevel: "medium" as const,
    riskLevel: "medium" as const,
    pros: ["Pro"],
    cons: ["Con"],
    recommendationReason: null,
    ...partial,
  };
}

describe("strategy schema", () => {
  it("normalizes mixed batch to three core tiers", () => {
    const normalized = normalizeStrategyBatch([
      draft({ name: "Light", type: "light_renewal" }),
      draft({ name: "Adaptive", type: "adaptive_reuse" }),
      draft({ name: "Deep", type: "deep_recreation" }),
      draft({ name: "Energy", type: "energy_retrofit" }),
    ]);

    expect(normalized).toHaveLength(3);
    expect(normalized.map((s) => s.type)).toEqual([
      "light_renewal",
      "medium_renovation",
      "deep_recreation",
    ]);
  });

  it("links spatial plans to drawing graph rooms by tier", () => {
    const lightLinks = linkStrategySpatialPlan(
      {
        spatialStrategy: "Retain 办公室 Office layout",
        designGoal: "Minimal change",
        summary: "Light",
      },
      "light",
      graph
    );
    expect(lightLinks.some((link) => link.roomLabel.includes("Office"))).toBe(true);
    expect(lightLinks.find((link) => link.roomLabel.includes("Corridor"))?.intervention).toBe(
      "retain"
    );

    const mediumLinks = linkStrategySpatialPlan(
      {
        spatialStrategy: "Merge 办公室 Office and 会议室 Meeting Room",
        designGoal: "Open gallery",
        summary: "Medium",
      },
      "medium",
      graph
    );
    expect(mediumLinks.some((link) => link.intervention === "merge")).toBe(true);
  });

  it("enriches strategies with tier profiles and graph node ids", () => {
    const strategies: StrategyWithMetrics[] = [
      {
        id: "s1",
        projectId: "p1",
        createdAt: new Date(),
        updatedAt: new Date(),
        ...draft({
          name: "Light",
          type: "light_renewal",
          spatialStrategy: "Adapt 会议室 Meeting Room",
        }),
        metrics: {
          cost: 30,
          schedule: 30,
          risk: 30,
          designValue: 40,
          constructionDifficulty: 30,
          preservationLevel: 90,
          feasibility: 88,
          lifecycleCost: 30,
        },
      },
      {
        id: "s2",
        projectId: "p1",
        createdAt: new Date(),
        updatedAt: new Date(),
        ...draft({
          name: "Medium",
          type: "medium_renovation",
          spatialStrategy: "Merge 办公室 Office and 会议室 Meeting Room",
        }),
        metrics: {
          cost: 50,
          schedule: 50,
          risk: 50,
          designValue: 70,
          constructionDifficulty: 50,
          preservationLevel: 70,
          feasibility: 72,
          lifecycleCost: 50,
        },
      },
      {
        id: "s3",
        projectId: "p1",
        createdAt: new Date(),
        updatedAt: new Date(),
        ...draft({
          name: "Deep",
          type: "deep_recreation",
          spatialStrategy: "Subdivide 办公室 Office",
        }),
        metrics: {
          cost: 80,
          schedule: 80,
          risk: 80,
          designValue: 95,
          constructionDifficulty: 80,
          preservationLevel: 35,
          feasibility: 55,
          lifecycleCost: 80,
        },
      },
    ];

    const enriched = enrichStrategiesWithProfiles(strategies, { drawingGraph: graph });
    expect(enriched).toHaveLength(3);
    expect(enriched[0]?.tierProfile?.tier).toBe("light");
    expect(enriched[1]?.tierProfile?.spatialLinks.length).toBeGreaterThan(0);
    expect(enriched[0]?.linkedGraphNodeIds?.length).toBeGreaterThan(0);
  });
});
