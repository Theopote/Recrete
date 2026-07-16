"use client";

import { formatDate } from "@/lib/utils";
import type { BuildingMemoryHistoryEntry } from "@/types/ai";
import { History } from "lucide-react";

const triggerLabels: Record<string, string> = {
  manual: "手动更新",
  document_analysis: "文档分析",
  strategy_generation: "方案生成",
  diagnosis_generation: "诊断生成",
};

interface BuildingMemoryHistoryPanelProps {
  history: BuildingMemoryHistoryEntry[];
}

export function BuildingMemoryHistoryPanel({ history }: BuildingMemoryHistoryPanelProps) {
  if (history.length === 0) return null;

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        <History className="h-3.5 w-3.5" />
        更新历史 ({history.length})
      </div>
      <ul className="space-y-2">
        {history.slice(0, 6).map((entry) => (
          <li key={entry.id} className="text-xs border rounded-md p-2.5 space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">
                {triggerLabels[entry.triggerType] ?? entry.triggerType}
              </span>
              <span className="text-muted-foreground">{formatDate(entry.createdAt)}</span>
            </div>
            <p className="text-muted-foreground line-clamp-2">{entry.summary}</p>
            <p className="text-[10px] text-muted-foreground">
              已知 {entry.knownFactsCount} · 缺失 {entry.missingInfoCount} · 风险 {entry.keyRisksCount}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
