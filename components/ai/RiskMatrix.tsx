import type { CostRiskMatrix } from "@/types/ai";
import { cn } from "@/lib/utils";

interface RiskMatrixProps {
  matrix: CostRiskMatrix;
}

function cellColor(value: number) {
  if (value >= 75) return "bg-red-500/20 text-red-700 dark:text-red-400";
  if (value >= 50) return "bg-amber-500/20 text-amber-700 dark:text-amber-400";
  return "bg-sage/15 text-sage";
}

export function RiskMatrix({ matrix }: RiskMatrixProps) {
  const dimensions = ["costRisk", "scheduleRisk", "constructionRisk", "complianceRisk"] as const;
  const labels = ["Cost", "Schedule", "Construction", "Compliance"];
  const showLifecycle = matrix.strategies.some((s) => s.lifecycleCostScore != null);

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full min-w-[480px] text-xs">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="p-2 text-left font-medium">Strategy</th>
            {labels.map((l) => (
              <th key={l} className="p-2 text-center font-medium">
                {l}
              </th>
            ))}
            {showLifecycle && (
              <th className="p-2 text-center font-medium" title="Capex risk adjusted for energy ROI">
                Lifecycle
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {matrix.strategies.map((row) => (
            <tr key={row.strategyId} className="border-b last:border-0">
              <td className="p-2 font-medium">{row.strategyName}</td>
              {dimensions.map((dim) => (
                <td key={dim} className="p-2 text-center">
                  <span
                    className={cn(
                      "inline-block min-w-[2.5rem] rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold",
                      cellColor(row[dim])
                    )}
                  >
                    {row[dim]}
                  </span>
                </td>
              ))}
              {showLifecycle && (
                <td className="p-2 text-center">
                  <span
                    className={cn(
                      "inline-block min-w-[2.5rem] rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold",
                      cellColor(row.lifecycleCostScore ?? row.costRisk)
                    )}
                    title="Energy ROI-adjusted lifecycle cost risk"
                  >
                    {row.lifecycleCostScore ?? row.costRisk}
                  </span>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
