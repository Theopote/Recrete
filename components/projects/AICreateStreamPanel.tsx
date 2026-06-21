"use client";

import { useEffect, useRef } from "react";
import {
  Sparkles,
  Brain,
  AlertTriangle,
  FileQuestion,
  ListChecks,
  CheckCircle2,
  Loader2,
  Circle,
  Building2,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectWithRelations } from "@/types";
import {
  CREATE_PHASES,
  type AICreateStreamEvent,
  type AICreateStreamPhase,
  type AICreateItemCategory,
} from "@/lib/ai/agents/project-creation-stream-types";

export interface StreamState {
  phaseStatus: Record<AICreateStreamPhase, "pending" | "active" | "done">;
  items: Array<{
    id: string;
    category: AICreateItemCategory;
    text: string;
    detail?: string;
  }>;
  project: ProjectWithRelations | null;
  summary: string | null;
  error: string | null;
  isComplete: boolean;
}

export const INITIAL_STREAM_STATE: StreamState = {
  phaseStatus: Object.fromEntries(
    CREATE_PHASES.map((p) => [p.id, "pending"])
  ) as StreamState["phaseStatus"],
  items: [],
  project: null,
  summary: null,
  error: null,
  isComplete: false,
};

export function applyStreamEvent(
  state: StreamState,
  event: AICreateStreamEvent
): StreamState {
  if (event.type === "phase") {
    const next = { ...state.phaseStatus };
    if (event.status === "start") {
      next[event.phase] = "active";
    } else {
      next[event.phase] = "done";
    }
    return { ...state, phaseStatus: next };
  }

  if (event.type === "item") {
    return {
      ...state,
      items: [
        ...state.items,
        {
          id: `item-${state.items.length}`,
          category: event.category,
          text: event.text,
          detail: event.detail,
        },
      ],
    };
  }

  if (event.type === "complete") {
    return {
      ...state,
      project: reviveProject(event.project),
      summary: event.summary,
      isComplete: true,
    };
  }

  if (event.type === "error") {
    return { ...state, error: event.message };
  }

  return state;
}

function reviveProject(raw: ProjectWithRelations): ProjectWithRelations {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
    buildingMemory: raw.buildingMemory
      ? {
          ...raw.buildingMemory,
          createdAt: new Date(raw.buildingMemory.createdAt),
          updatedAt: new Date(raw.buildingMemory.updatedAt),
          lastUpdatedByAI: new Date(raw.buildingMemory.lastUpdatedByAI),
        }
      : null,
    tasks: raw.tasks?.map((t) => ({
      ...t,
      createdAt: new Date(t.createdAt),
      updatedAt: new Date(t.updatedAt),
      dueDate: t.dueDate ? new Date(t.dueDate) : null,
    })),
  };
}

const CATEGORY_META: Record<
  AICreateItemCategory,
  { icon: React.ComponentType<{ className?: string }>; label: string; color: string }
> = {
  profile: { icon: Building2, label: "Profile", color: "text-copper" },
  memory: { icon: Brain, label: "Memory", color: "text-sage" },
  risk: { icon: AlertTriangle, label: "Risk", color: "text-amber-600" },
  missing: { icon: FileQuestion, label: "Missing", color: "text-muted-foreground" },
  task: { icon: ListChecks, label: "Task", color: "text-copper" },
  insight: { icon: Lightbulb, label: "Insight", color: "text-sage" },
};

interface AICreateStreamPanelProps {
  state: StreamState;
}

export function AICreateStreamPanel({ state }: AICreateStreamPanelProps) {
  const feedRef = useRef<HTMLDivElement>(null);
  const doneCount = CREATE_PHASES.filter((p) => state.phaseStatus[p.id] === "done").length;
  const progress = state.isComplete ? 100 : Math.round((doneCount / CREATE_PHASES.length) * 100);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [state.items.length, state.isComplete]);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="rounded-lg border border-copper/25 bg-card overflow-hidden shadow-sm">
        <div className="border-b bg-copper/5 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {!state.isComplete ? (
              <Loader2 className="h-4 w-4 text-copper animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-sage" />
            )}
            <div>
              <p className="text-sm font-medium">
                {state.isComplete ? "Project ready" : "砼憶正在理解您的建筑…"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {state.isComplete
                  ? "Building Memory initialized — redirecting"
                  : "AI is generating your project step by step"}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono tabular-nums text-copper">{progress}%</span>
        </div>

        <div className="h-1 bg-muted">
          <div
            className="h-full bg-copper transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] divide-y md:divide-y-0 md:divide-x">
          <div className="p-4 space-y-1">
            {CREATE_PHASES.map((phase) => {
              const status = state.phaseStatus[phase.id];
              return (
                <PhaseRow
                  key={phase.id}
                  label={phase.label}
                  labelZh={phase.labelZh}
                  status={status}
                />
              );
            })}
          </div>

          <div ref={feedRef} className="p-4 max-h-[320px] overflow-y-auto space-y-2">
            {state.items.length === 0 && !state.isComplete && (
              <p className="text-xs text-muted-foreground py-6 text-center">
                Waiting for AI output…
              </p>
            )}
            {state.items.map((item, index) => (
              <StreamItem key={item.id} item={item} index={index} />
            ))}
            {state.isComplete && state.project && (
              <div className="mt-3 rounded-md border border-sage/30 bg-sage/5 p-3 animate-in fade-in duration-500">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-3.5 w-3.5 text-sage" />
                  <p className="text-xs font-semibold">{state.project.name}</p>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  {state.summary}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {state.error && (
        <p className="text-xs text-destructive text-center">{state.error}</p>
      )}
    </div>
  );
}

function PhaseRow({
  label,
  labelZh,
  status,
}: {
  label: string;
  labelZh: string;
  status: "pending" | "active" | "done";
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-md px-2 py-1.5 text-[11px] transition-colors",
        status === "active" && "bg-copper/10 text-foreground",
        status === "done" && "text-muted-foreground",
        status === "pending" && "text-muted-foreground/50"
      )}
    >
      {status === "done" ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-sage shrink-0 mt-0.5" />
      ) : status === "active" ? (
        <Loader2 className="h-3.5 w-3.5 text-copper animate-spin shrink-0 mt-0.5" />
      ) : (
        <Circle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
      )}
      <div className="min-w-0">
        <p className={cn("font-medium leading-tight", status === "active" && "text-copper")}>
          {label}
        </p>
        <p className="text-[10px] opacity-70">{labelZh}</p>
      </div>
    </div>
  );
}

function StreamItem({
  item,
  index,
}: {
  item: StreamState["items"][number];
  index: number;
}) {
  const meta = CATEGORY_META[item.category];
  const Icon = meta.icon;

  return (
    <div
      className="flex gap-2.5 rounded-md border bg-background/80 px-3 py-2 animate-in fade-in slide-in-from-left-2 duration-300 fill-mode-both"
      style={{ animationDelay: `${Math.min(index * 20, 200)}ms` }}
    >
      <Icon className={cn("h-3.5 w-3.5 shrink-0 mt-0.5", meta.color)} />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-0.5">
          {meta.label}
        </p>
        <p className="text-xs leading-relaxed">{item.text}</p>
        {item.detail && (
          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{item.detail}</p>
        )}
      </div>
    </div>
  );
}

export async function consumeProjectCreateStream(
  brief: string,
  onEvent: (event: AICreateStreamEvent) => void
): Promise<void> {
  const res = await fetch("/api/projects/ai-create/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ brief }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    onEvent({
      type: "error",
      message: (data as { error?: string }).error ?? "Failed to start AI creation",
    });
    return;
  }

  if (!res.body) {
    onEvent({ type: "error", message: "No stream response" });
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      const line = chunk.trim();
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload) continue;
      onEvent(JSON.parse(payload) as AICreateStreamEvent);
    }
  }
}
