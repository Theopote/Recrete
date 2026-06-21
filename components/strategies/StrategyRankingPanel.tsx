import { cn } from "@/lib/utils";
import type { StrategyWithMetrics } from "@/types";
import { Trophy, Medal } from "lucide-react";

interface StrategyRankingPanelProps {
  strategies: StrategyWithMetrics[];
}

export function StrategyRankingPanel({ strategies }: StrategyRankingPanelProps) {
  const ranked = [...strategies]
    .filter((s) => s.rank != null)
    .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));

  if (ranked.length === 0) return null;

  return (
    <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4 text-copper" />
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          方案综合排序 · Strategy Ranking
        </h3>
      </div>
      <p className="text-[11px] text-muted-foreground">
        基于预算、面积、功能目标与多维指标加权计算综合得分（满分 100）
      </p>
      <ol className="space-y-2">
        {ranked.map((strategy) => (
          <li
            key={strategy.id}
            className={cn(
              "flex items-center gap-3 rounded-md border px-3 py-2 text-xs",
              strategy.rank === 1 && "border-copper/40 bg-copper/5"
            )}
          >
            <RankBadge rank={strategy.rank!} />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{strategy.name}</p>
              <p className="text-muted-foreground text-[10px] mt-0.5">
                面积匹配 {strategy.areaFitScore ?? "—"} · 综合 {strategy.compositeScore ?? "—"}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-semibold tabular-nums text-sage">
                {strategy.compositeScore}
              </p>
              <p className="text-[10px] text-muted-foreground">综合分</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-copper text-copper-foreground">
        <Trophy className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (rank <= 3) {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted border">
        <Medal className="h-3.5 w-3.5 text-muted-foreground" />
      </span>
    );
  }
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted border text-xs font-medium">
      {rank}
    </span>
  );
}
