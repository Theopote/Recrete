import "server-only";

import type { ProjectWithRelations } from "@/types";
import { parseBriefSync, type AIProjectDraft } from "./project-creation-agent";
import { createProjectFromBrief } from "@/lib/db/repository";
import {
  CREATE_PHASES,
  type AICreateStreamEvent,
  type AICreateStreamPhase,
} from "./project-creation-stream-types";

export type {
  AICreateStreamPhase,
  AICreateItemCategory,
  AICreateStreamEvent,
} from "./project-creation-stream-types";
export { CREATE_PHASES } from "./project-creation-stream-types";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function serializeProject(project: ProjectWithRelations): ProjectWithRelations {
  return JSON.parse(JSON.stringify(project)) as ProjectWithRelations;
}

async function emitProfileItems(
  draft: AIProjectDraft,
  emit: (event: AICreateStreamEvent) => void
) {
  const p = draft.project;
  const items: { text: string; detail?: string }[] = [
    { text: p.name, detail: "Project name · 项目名称" },
    { text: `${p.location} · ${p.constructionYear}`, detail: "Location & year · 位置与建成年份" },
    { text: `${p.structureType}, ${p.floorCount} floors, ~${p.grossFloorArea.toLocaleString()} sqm`, detail: "Building profile · 建筑档案" },
    { text: `${p.originalFunction} → ${p.targetFunction}`, detail: "Function conversion · 功能转换" },
    { text: `Budget: ${p.budgetLevel} · Risk: ${draft.riskLevel}`, detail: "Budget & risk · 预算与风险" },
  ];
  for (const item of items) {
    await sleep(380);
    emit({ type: "item", category: "profile", text: item.text, detail: item.detail });
  }
}

export async function streamProjectCreation(
  brief: string,
  emit: (event: AICreateStreamEvent) => void
): Promise<void> {
  const phase = async (id: AICreateStreamPhase, fn: () => Promise<void>) => {
    const meta = CREATE_PHASES.find((p) => p.id === id)!;
    emit({ type: "phase", phase: id, label: meta.label, labelZh: meta.labelZh, status: "start" });
    await fn();
    emit({ type: "phase", phase: id, label: meta.label, labelZh: meta.labelZh, status: "done" });
  };

  let draft: AIProjectDraft;

  await phase("read_brief", async () => {
    await sleep(700);
  });

  await phase("extract_profile", async () => {
    await sleep(500);
    draft = parseBriefSync(brief);
    await emitProfileItems(draft, emit);
  });

  await phase("assess_risks", async () => {
    for (const risk of draft!.buildingMemory.keyRisks) {
      await sleep(420);
      emit({ type: "item", category: "risk", text: risk });
    }
    for (const insight of draft!.insights) {
      await sleep(360);
      emit({
        type: "item",
        category: "insight",
        text: insight.title,
        detail: insight.summary,
      });
    }
  });

  await phase("build_memory", async () => {
    await sleep(400);
    emit({
      type: "item",
      category: "memory",
      text: draft!.buildingMemory.summary,
      detail: "AI summary · 建筑记忆摘要",
    });
    for (const fact of draft!.buildingMemory.knownFacts.slice(0, 3)) {
      await sleep(320);
      emit({ type: "item", category: "memory", text: fact, detail: "Known fact · AI 已知" });
    }
    for (const gap of draft!.buildingMemory.missingInformation) {
      await sleep(300);
      emit({ type: "item", category: "missing", text: gap });
    }
    await sleep(350);
    emit({
      type: "item",
      category: "memory",
      text: draft!.buildingMemory.renovationPotential,
      detail: "Renovation potential · 改造潜力",
    });
  });

  await phase("plan_tasks", async () => {
    for (const task of draft!.tasks) {
      await sleep(380);
      emit({
        type: "item",
        category: "task",
        text: task.title,
        detail: task.description,
      });
    }
  });

  await phase("finalize", async () => {
    await sleep(500);
    const project = await createProjectFromBrief(draft!);
    emit({
      type: "complete",
      project: serializeProject(project),
      summary: draft!.analysisSummary,
    });
  });
}
