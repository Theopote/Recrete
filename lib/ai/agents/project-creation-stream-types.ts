import type { ProjectWithRelations } from "@/types";

export type AICreateStreamPhase =
  | "read_brief"
  | "extract_profile"
  | "assess_risks"
  | "build_memory"
  | "plan_tasks"
  | "finalize";

export type AICreateItemCategory =
  | "profile"
  | "memory"
  | "risk"
  | "missing"
  | "task"
  | "insight";

export type AICreateStreamEvent =
  | {
      type: "phase";
      phase: AICreateStreamPhase;
      label: string;
      labelZh: string;
      status: "start" | "done";
    }
  | {
      type: "item";
      category: AICreateItemCategory;
      text: string;
      detail?: string;
    }
  | { type: "complete"; project: ProjectWithRelations; summary: string }
  | { type: "error"; message: string };

export const CREATE_PHASES: {
  id: AICreateStreamPhase;
  label: string;
  labelZh: string;
}[] = [
  { id: "read_brief", label: "Reading building brief", labelZh: "阅读建筑描述" },
  { id: "extract_profile", label: "Extracting building profile", labelZh: "提取建筑档案" },
  { id: "assess_risks", label: "Assessing risks & compliance", labelZh: "预判风险与合规" },
  { id: "build_memory", label: "Initializing Building Memory", labelZh: "初始化建筑记忆" },
  { id: "plan_tasks", label: "Planning next-step tasks", labelZh: "生成下一步任务" },
  { id: "finalize", label: "Creating project workspace", labelZh: "创建项目工作区" },
];
