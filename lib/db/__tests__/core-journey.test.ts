import { describe, it, expect, beforeEach } from "vitest";
import { parseBriefSync } from "@/lib/ai/agents/project-creation-agent";
import { createProjectFromBrief, getProjectById, replaceStrategies } from "@/lib/db/repository";
import { addStrategyComment, clearStrategyCommentsMemory } from "@/lib/db/strategy-comments";

describe("core journey (mock store)", () => {
  beforeEach(() => {
    process.env.USE_DATABASE = "false";
    clearStrategyCommentsMemory();
  });

  it("creates project with building memory and tasks", async () => {
    const draft = parseBriefSync(
      "1986年西安混凝土框架办公楼，改社区文化中心，预算有限"
    );
    const project = await createProjectFromBrief(draft, "org-1");
    const loaded = await getProjectById(project.id, "org-1");
    expect(loaded?.buildingMemory).toBeTruthy();
    expect((loaded?.tasks?.length ?? 0)).toBeGreaterThan(0);
  });

  it("persists replaced strategies", async () => {
    const draft = parseBriefSync(`test strategies ${Date.now()}`);
    const project = await createProjectFromBrief(draft, "org-1");
    await replaceStrategies(project.id, [
      {
        name: "A",
        type: "light_renewal",
        summary: "s",
        designGoal: "g",
        spatialStrategy: "s",
        structuralStrategy: "s",
        facadeStrategy: "s",
        mepStrategy: "s",
        costLevel: "low",
        scheduleLevel: "low",
        riskLevel: "low",
        pros: ["p"],
        cons: ["c"],
        recommendationReason: null,
      },
    ]);
    const loaded = await getProjectById(project.id, "org-1");
    expect(loaded?.strategies?.length).toBe(1);
  });

  it("adds strategy review comments", async () => {
    const draft = parseBriefSync(`comment ${Date.now()}`);
    const project = await createProjectFromBrief(draft, "org-1");
    const [strategy] = await replaceStrategies(project.id, [
      {
        name: "S1",
        type: "light_renewal",
        summary: "s",
        designGoal: "g",
        spatialStrategy: "s",
        structuralStrategy: "s",
        facadeStrategy: "s",
        mepStrategy: "s",
        costLevel: "low",
        scheduleLevel: "low",
        riskLevel: "low",
        pros: ["p"],
        cons: ["c"],
        recommendationReason: null,
      },
    ]);
    const comment = await addStrategyComment({
      projectId: project.id,
      strategyId: strategy.id,
      authorId: "user-1",
      authorName: "U",
      content: "hello",
    });
    expect(comment.content).toBe("hello");
  });
});
