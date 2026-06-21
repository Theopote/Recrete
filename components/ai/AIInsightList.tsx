import { AIInsightCard } from "./AIInsightCard";
import type { AIInsight } from "@/types/ai";
import { EmptyState } from "@/components/app/EmptyState";
import { Sparkles } from "lucide-react";

interface AIInsightListProps {
  insights: AIInsight[];
  compact?: boolean;
  emptyMessage?: string;
}

export function AIInsightList({ insights, compact, emptyMessage }: AIInsightListProps) {
  if (insights.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="No AI insights yet"
        description={emptyMessage ?? "Run an AI analysis to generate insights."}
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
