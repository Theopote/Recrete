"use client";

import { AIInsightCard } from "./AIInsightCard";
import type { AIInsight } from "@/types/ai";
import { EmptyState } from "@/components/app/EmptyState";
import { Sparkles } from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";

interface AIInsightListProps {
  insights: AIInsight[];
  compact?: boolean;
  emptyMessage?: string;
}

export function AIInsightList({ insights, compact, emptyMessage }: AIInsightListProps) {
  const { t } = useLocale();

  if (insights.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title={t("No AI insights yet", "暂无 AI 洞察")}
        description={
          emptyMessage ?? t("Run an AI analysis to generate insights.", "运行 AI 分析以生成洞察。")
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {insights.map((insight) => (
        <AIInsightCard key={insight.id} insight={insight} compact={compact} />
      ))}
    </div>
  );
}
