"use client";

import { cn } from "@/lib/utils";
import { getRiskColor, riskLevelLabels, riskLevelLabelsZh } from "@/lib/utils/labels";
import { useLocale } from "@/lib/i18n/use-locale";
import type { RiskLevel } from "@/types";

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
}

export function RiskBadge({ level, className }: RiskBadgeProps) {
  const { label, t } = useLocale();

  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium",
        getRiskColor(level),
        className
      )}
    >
      {label(riskLevelLabels, riskLevelLabelsZh, level)} {t("Risk", "风险")}
    </span>
  );
}
