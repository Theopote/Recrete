"use client";

import Link from "next/link";
import type { AITask } from "@/types/ai";
import { ArrowRight, ListChecks } from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";

interface RecommendedActionsProps {
  tasks: AITask[];
  projectId?: string;
}

export function RecommendedActions({ tasks, projectId }: RecommendedActionsProps) {
  const { t } = useLocale();
  const pending = tasks
    .filter((task) => task.status === "pending" || task.status === "in_progress")
    .slice(0, 5);

  return (
    <div className="rounded-md border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <ListChecks className="h-4 w-4 text-copper" />
        <h4 className="text-xs font-semibold uppercase tracking-wide">
          {t("Recommended Actions", "建议行动")}
        </h4>
      </div>
      <ul className="space-y-2">
        {pending.map((task) => (
          <li key={task.id} className="flex items-start gap-2 text-xs">
            <span
              className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                task.priority === "critical"
                  ? "bg-red-500"
                  : task.priority === "high"
                    ? "bg-amber-500"
                    : "bg-muted-foreground"
              }`}
            />
            <div className="flex-1">
              <p className="font-medium">{task.title}</p>
              <p className="text-muted-foreground line-clamp-1">{task.description}</p>
            </div>
          </li>
        ))}
      </ul>
      {projectId && (
        <Link
          href={`/projects/${projectId}?section=building-memory`}
          className="mt-3 inline-flex items-center gap-1 text-[10px] font-medium text-copper hover:underline"
        >
          {t("View all tasks", "查看全部任务")} <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}
