"use client";

import { cn } from "@/lib/utils";
import type { StrategyCriterionContribution, StrategyScoreWeights } from "@/types/ai";
import { useLocale } from "@/lib/i18n/use-locale";

interface StrategyScoreBreakdownProps {
  contributions: StrategyCriterionContribution[];
  weights?: StrategyScoreWeights;
  compositeScore?: number;
  lifecycleBonus?: number;
  compact?: boolean;
  className?: string;
}

export function StrategyScoreBreakdown({
  contributions,
  weights,
  compositeScore,
  lifecycleBonus = 0,
  compact = false,
  className,
}: StrategyScoreBreakdownProps) {
  const { t } = useLocale();
  const sorted = [...contributions].sort((a, b) => b.weightedPoints - a.weightedPoints);

  return (
    <div className={cn("space-y-2", className)}>
      {!compact && weights && (
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          {t(
            "Weighted by your lab settings — each bar shows raw score × weight = points toward the composite.",
            "按实验室参数加权 — 每行显示 原始分 × 权重 = 综合贡献分。"
          )}
        </p>
      )}

      <div className="space-y-1.5">
        {sorted.map((item) => (
          <CriterionRow key={item.key} item={item} compact={compact} />
        ))}
      </div>

      {(lifecycleBonus > 0 || compositeScore != null) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[10px] text-muted-foreground border-t">
          {lifecycleBonus > 0 && (
            <span>
              {t("Lifecycle bonus", "全周期加分")}: +{Math.round(lifecycleBonus)}
            </span>
          )}
          {compositeScore != null && (
            <span className="font-medium text-foreground">
              {t("Composite", "综合")}: {compositeScore}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function CriterionRow({
  item,
  compact,
}: {
  item: StrategyCriterionContribution;
  compact: boolean;
}) {
  const { t } = useLocale();
  const label = t(item.labelEn, item.labelZh);
  const weightPct = Math.round(item.weight * 100);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-0.5 items-center">
      <div className="min-w-0">
        <div className="flex items-baseline justify-between gap-2 text-[10px]">
          <span className="truncate text-muted-foreground">{label}</span>
          {!compact && (
            <span className="shrink-0 tabular-nums">
              {item.rawScore}×{weightPct}%={item.weightedPoints}
            </span>
          )}
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-0.5">
          <div
            className="h-full bg-sage/80 rounded-full"
            style={{ width: `${Math.min(100, item.rawScore)}%` }}
          />
        </div>
      </div>
      <span className="text-xs font-semibold tabular-nums text-sage shrink-0">
        +{item.weightedPoints}
      </span>
    </div>
  );
}

interface StrategyWeightsLegendProps {
  weights: StrategyScoreWeights;
  className?: string;
}

export function StrategyWeightsLegend({ weights, className }: StrategyWeightsLegendProps) {
  const { t } = useLocale();
  const entries = Object.entries(weights)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  return (
    <p className={cn("text-[10px] text-muted-foreground", className)}>
      {t("Top weights", "主要权重")}:{" "}
      {entries
        .map(([key, weight]) => {
          const label = t(
            key === "cost"
              ? "Cost"
              : key === "schedule"
                ? "Schedule"
                : key === "risk"
                  ? "Risk"
                  : key === "designValue"
                    ? "Design"
                    : key === "feasibility"
                      ? "Feasibility"
                      : key === "preservation"
                        ? "Preservation"
                        : "Area",
            key === "cost"
              ? "成本"
              : key === "schedule"
                ? "工期"
                : key === "risk"
                  ? "风险"
                  : key === "designValue"
                    ? "设计"
                    : key === "feasibility"
                      ? "可实施"
                      : key === "preservation"
                        ? "保留"
                        : "面积"
          );
          return `${label} ${Math.round(weight * 100)}%`;
        })
        .join(" · ")}
    </p>
  );
}
