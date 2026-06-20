import { cn } from "@/lib/utils";
import { getRiskColor, riskLevelLabels } from "@/lib/utils/labels";
import type { RiskLevel } from "@/types";

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
}

export function RiskBadge({ level, className }: RiskBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium",
        getRiskColor(level),
        className
      )}
    >
      {riskLevelLabels[level]} Risk
    </span>
  );
}
