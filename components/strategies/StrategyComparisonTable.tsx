import { cn } from "@/lib/utils";
import type { StrategyWithMetrics } from "@/types";

interface StrategyComparisonTableProps {
  strategies: StrategyWithMetrics[];
}

const METRICS = [
  { key: "cost" as const, label: "Cost", invert: true },
  { key: "schedule" as const, label: "Schedule", invert: true },
  { key: "risk" as const, label: "Risk", invert: true },
  { key: "designValue" as const, label: "Design Value", invert: false },
  { key: "constructionDifficulty" as const, label: "Construction Difficulty", invert: true },
  { key: "preservationLevel" as const, label: "Preservation Level", invert: false },
];

export function StrategyComparisonTable({ strategies }: StrategyComparisonTableProps) {
  if (strategies.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Metric</th>
            {strategies.map((s) => (
              <th key={s.id} className="px-4 py-3 text-left font-medium min-w-[140px]">
                {s.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {METRICS.map((metric) => (
            <tr key={metric.key} className="border-b last:border-0">
              <td className="px-4 py-3 font-medium text-muted-foreground">{metric.label}</td>
              {strategies.map((s) => {
                const value = s.metrics[metric.key];
                const isBest = metric.invert
                  ? value === Math.min(...strategies.map((st) => st.metrics[metric.key]))
                  : value === Math.max(...strategies.map((st) => st.metrics[metric.key]));

                return (
                  <td key={s.id} className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", isBest ? "bg-sage" : "bg-concrete")}
                          style={{ width: `${value}%` }}
                        />
                      </div>
                      <span className={cn("tabular-nums w-8 text-right", isBest && "font-semibold text-sage")}>
                        {value}
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
