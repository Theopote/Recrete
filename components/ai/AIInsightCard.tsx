import { Card, CardContent } from "@/components/ui/card";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { RiskBadge } from "@/components/app/RiskBadge";
import type { AIInsight } from "@/types/ai";
import { insightTypeLabels } from "@/lib/utils/labels";
import { cn } from "@/lib/utils";

interface AIInsightCardProps {
  insight: AIInsight;
  compact?: boolean;
}

const typeColors: Record<string, string> = {
  missing_info: "border-l-blue-500",
  risk: "border-l-red-500",
  opportunity: "border-l-sage",
  design_strategy: "border-l-copper",
  cost_warning: "border-l-amber-500",
  schedule_warning: "border-l-orange-500",
  compliance_warning: "border-l-purple-500",
  site_issue: "border-l-red-400",
  report_suggestion: "border-l-slate-400",
};

export function AIInsightCard({ insight, compact }: AIInsightCardProps) {
  return (
    <Card className={cn("border-l-4", typeColors[insight.type] ?? "border-l-muted")}>
      <CardContent className={cn("p-4", compact && "p-3")}>
        <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {insightTypeLabels[insight.type] ?? insight.type}
            </p>
            <h4 className="text-sm font-semibold leading-tight">{insight.title}</h4>
          </div>
          <div className="flex items-center gap-1.5">
            <RiskBadge level={insight.priority} />
            <ConfidenceBadge confidence={insight.confidence} />
          </div>
        </div>
        <p className={cn("text-xs text-foreground/80", compact && "line-clamp-2")}>
          {insight.summary}
        </p>
        {!compact && insight.recommendation && (
          <p className="mt-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Recommendation:</span>{" "}
            {insight.recommendation}
          </p>
        )}
        {!compact && insight.evidence && (
          <p className="mt-1.5 text-[10px] font-mono text-muted-foreground/80">
            Evidence: {insight.evidence}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
