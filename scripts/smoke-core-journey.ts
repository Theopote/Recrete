/**
 * Core journey smoke checks (mock / in-process, no running server required).
 *
 * Usage: npm run smoke:core
 */
import { parseBriefSync } from "@/lib/ai/agents/project-creation-agent";
import { runStrategyWorkflow } from "@/lib/ai/workflow/strategy-workflow";
import {
  createProjectFromBrief,
  getProjectById,
  replaceStrategies,
} from "@/lib/db/repository";
import { addStrategyComment, clearStrategyCommentsMemory } from "@/lib/db/strategy-comments";
import { getProjects } from "@/lib/db/repository";

const CHECKS: { name: string; run: () => Promise<void> }[] = [];

function check(name: string, fn: () => Promise<void>) {
  CHECKS.push({ name, run: fn });
}

const BRIEF =
  "我有一栋 1986 年建成的混凝土框架办公楼，位于西安，原本是政府办公，现在想改成社区文化中心，预算有限，希望保留主体结构。";

check("create project from brief persists building memory", async () => {
  const draft = parseBriefSync(BRIEF);
  const project = await createProjectFromBrief(draft, "org-1");
  const loaded = await getProjectById(project.id, "org-1");
  if (!loaded?.buildingMemory) {
    throw new Error("Building Memory missing after createProjectFromBrief");
  }
  if ((loaded.tasks?.length ?? 0) === 0) {
    throw new Error("Expected tasks on new project");
  }
});

check("replace strategies persists three options", async () => {
  const draft = parseBriefSync(`${BRIEF} smoke test ${Date.now()}`);
  const project = await createProjectFromBrief(draft, "org-1");
  const strategies = await replaceStrategies(project.id, [
    {
      name: "Light",
      type: "light_intervention",
      summary: "Minimal intervention",
      designGoal: "Preserve",
      spatialStrategy: "Keep layout",
      structuralStrategy: "No change",
      facadeStrategy: "Clean up",
      mepStrategy: "Upgrade MEP",
      costLevel: "low",
      scheduleLevel: "low",
      riskLevel: "low",
      pros: ["Fast"],
      cons: ["Limited change"],
      recommendationReason: null,
    },
    {
      name: "Medium",
      type: "medium_reconfiguration",
      summary: "Reconfigure",
      designGoal: "Adapt",
      spatialStrategy: "Replan",
      structuralStrategy: "Local reinforce",
      facadeStrategy: "New skin",
      mepStrategy: "Full MEP",
      costLevel: "medium",
      scheduleLevel: "medium",
      riskLevel: "medium",
      pros: ["Balanced"],
      cons: ["More cost"],
      recommendationReason: "Best balance",
    },
    {
      name: "Deep",
      type: "deep_recreation",
      summary: "Deep retrofit",
      designGoal: "Transform",
      spatialStrategy: "Rebuild core",
      structuralStrategy: "Major work",
      facadeStrategy: "New identity",
      mepStrategy: "All new",
      costLevel: "high",
      scheduleLevel: "high",
      riskLevel: "high",
      pros: ["Max potential"],
      cons: ["High cost"],
      recommendationReason: null,
    },
  ]);
  if (strategies.length !== 3) {
    throw new Error(`Expected 3 strategies, got ${strategies.length}`);
  }
  const reloaded = await getProjectById(project.id, "org-1");
  if ((reloaded?.strategies?.length ?? 0) !== 3) {
    throw new Error("Strategies not persisted on reload");
  }
});

check("tenant isolation on project list", async () => {
  const org1 = await getProjects("org-1");
  const org2 = await getProjects("org-2");
  const leak = org2.some((p) => org1.some((o) => o.id === p.id));
  if (leak) {
    throw new Error("Cross-org project leak in getProjects");
  }
});

check("strategy review comment round-trip", async () => {
  clearStrategyCommentsMemory();
  const draft = parseBriefSync(`${BRIEF} comment test ${Date.now()}`);
  const project = await createProjectFromBrief(draft, "org-1");
  const strategies = await replaceStrategies(project.id, [
    {
      name: "Test Strategy",
      type: "light_intervention",
      summary: "Test",
      designGoal: "Test",
      spatialStrategy: "Test",
      structuralStrategy: "Test",
      facadeStrategy: "Test",
      mepStrategy: "Test",
      costLevel: "low",
      scheduleLevel: "low",
      riskLevel: "low",
      pros: ["A"],
      cons: ["B"],
      recommendationReason: null,
    },
  ]);
  const comment = await addStrategyComment({
    projectId: project.id,
    strategyId: strategies[0].id,
    authorId: "user-1",
    authorName: "Test User",
    content: "请结构同事确认柱网",
    riskTag: "结构老化",
    mentionedUserIds: ["user-2"],
  });
  if (!comment.id) throw new Error("Comment not created");
});

check("strategy workflow generates ranked strategies", async () => {
  const draft = parseBriefSync(`${BRIEF} workflow ${Date.now()}`);
  const project = await createProjectFromBrief(draft, "org-1");
  const result = await runStrategyWorkflow(project.id, "org-1");
  if (!result || result.strategies.length < 3) {
    throw new Error("Strategy workflow did not return 3 strategies");
  }
});

async function main() {
  process.env.USE_DATABASE = "false";

  console.log("Recrete core journey smoke checks\n");
  let passed = 0;
  let failed = 0;

  for (const { name, run } of CHECKS) {
    process.stdout.write(`  • ${name} ... `);
    try {
      await run();
      console.log("OK");
      passed += 1;
    } catch (error) {
      console.log("FAIL");
      console.error(`    ${error instanceof Error ? error.message : error}`);
      failed += 1;
    }
  }

  console.log(`\nResult: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
