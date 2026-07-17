"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { StrategyWithMetrics } from "@/types";
import {
  StrategyScoreBreakdown,
  StrategyWeightsLegend,
} from "@/components/strategies/StrategyScoreBreakdown";
import { useLocale } from "@/lib/i18n/use-locale";
import { ChevronDown, Trophy, Medal } from "lucide-react";

interface StrategyRankingPanelProps {
  strategies: StrategyWithMetrics[];
}

export function StrategyRankingPanel({ strategies }: StrategyRankingPanelProps) {
  const { t } = useLocale();
  const ranked = [...strategies]
    .filter((s) => s.rank != null)
    .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));

  const [expandedId, setExpandedId] = useState<string | null>(ranked[0]?.id ?? null);

  if (ranked.length === 0) return null;

  const sampleWeights = ranked.find((s) => s.scoreWeights)?.scoreWeights;

  return (
    <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4 text-copper" />
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {t("Strategy Ranking", "方案综合排序")}
        </h3>
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        {t(
          "Multi-criteria score (0–100): cost, schedule, risk, design value, feasibility, preservation, and area fit — weighted by your lab parameters.",
          "多准则评分（0–100）：成本、工期、风险、设计价值、可实施性、保留契合与面积匹配 — 按实验室参数加权。"
        )}
      </p>
      {sampleWeights && <StrategyWeightsLegend weights={sampleWeights} />}

      <ol className="space-y-2">
        {ranked.map((strategy) => {
          const expanded = expandedId === strategy.id;
          const hasBreakdown = (strategy.scoreContributions?.length ?? 0) > 0;

          return (
            <li
              key={strategy.id}
              className={cn(
                "rounded-md border text-xs overflow-hidden",
                strategy.rank === 1 && "border-copper/40 bg-copper/5"
              )}
            >
              <button
                type="button"
                className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted/30 transition-colors"
                onClick={() =>
                  setExpandedId(expanded ? null : strategy.id)
                }
                disabled={!hasBreakdown}
              >
                <RankBadge rank={strategy.rank!} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{strategy.name}</p>
                  <p className="text-muted-foreground text-[10px] mt-0.5">
                    {strategy.rankSummary ??
                      t(
                        `Area fit ${strategy.areaFitScore ?? "—"} · composite ${strategy.compositeScore ?? "—"}`,
                        `面积匹配 ${strategy.areaFitScore ?? "—"} · 综合 ${strategy.compositeScore ?? "—"}`
                      )}
                  </p>
                </div>
                <div className="text-right shrink-0 flex items-center gap-2">
                  <div>
                    <p className="text-lg font-semibold tabular-nums text-sage">
                      {strategy.compositeScore}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {t("Composite", "综合分")}
                    </p>
                  </div>
                  {hasBreakdown && (
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        expanded && "rotate-180"
                      )}
                    />
                  )}
                </div>
              </button>

              {expanded && hasBreakdown && (
                <div className="border-t px-3 py-3 bg-background/60">
                  <StrategyScoreBreakdown
                    contributions={strategy.scoreContributions!}
                    weights={strategy.scoreWeights}
                    compositeScore={strategy.compositeScore}
                    lifecycleBonus={strategy.lifecycleBonus}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-copper text-copper-foreground shrink-0">
        <Trophy className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (rank <= 3) {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted border shrink-0">
        <Medal className="h-3.5 w-3.5 text-muted-foreground" />
      </span>
    );
  }
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted border text-xs font-medium shrink-0">
      {rank}
    </span>
  );
}
