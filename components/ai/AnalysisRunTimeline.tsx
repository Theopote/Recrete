"use client";

import type { AIAnalysisRun } from "@/types/ai";
import { formatDate } from "@/lib/utils";
import { analysisTypeLabels, analysisTypeLabelsZh } from "@/lib/utils/labels";
import { useLocale } from "@/lib/i18n/use-locale";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { Bot } from "lucide-react";

interface AnalysisRunTimelineProps {
  runs: AIAnalysisRun[];
  limit?: number;
}

export function AnalysisRunTimeline({ runs, limit = 8 }: AnalysisRunTimelineProps) {
  const { t, label } = useLocale();
  const sorted = [...runs]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);

  if (sorted.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        {t("No AI analysis runs yet.", "暂无 AI 分析记录。")}
      </p>
    );
  }

  return (
    <div className="space-y-0">
      {sorted.map((run, i) => (
        <div key={run.id} className="relative flex gap-3 pb-4">
          {i < sorted.length - 1 && (
            <div className="absolute left-[11px] top-6 h-full w-px bg-border" />
          )}
          <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-card">
            <Bot className="h-3 w-3 text-copper" />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold">
                {label(analysisTypeLabels, analysisTypeLabelsZh, run.analysisType) ??
                  run.analysisType}
              </p>
              <ConfidenceBadge confidence={run.confidence} />
            </div>
            <p className="mt-0.5 text-[10px] text-muted-foreground line-clamp-2">
              {run.outputSummary}
            </p>
            <p className="mt-1 text-[10px] font-mono text-muted-foreground/70">
              {formatDate(run.createdAt)} · {run.modelName}
              {run.generatedItemCount > 0 &&
                ` · ${run.generatedItemCount} ${t("items", "项")}`}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
