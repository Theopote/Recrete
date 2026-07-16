"use client";

import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/use-locale";

interface ConfidenceBadgeProps {
  confidence: number;
  className?: string;
}

export function ConfidenceBadge({ confidence, className }: ConfidenceBadgeProps) {
  const { t } = useLocale();
  const pct = Math.round(confidence * 100);
  const level = pct >= 85 ? "high" : pct >= 70 ? "medium" : "low";
  const tierLabel =
    level === "high"
      ? t("Strong evidence", "证据充分")
      : level === "medium"
        ? t("Moderate evidence", "证据一般")
        : t("Limited evidence", "证据有限");

  return (
    <span
      title={t(
        "Evidence strength score — not a statistical probability",
        "证据强度评分，非统计概率"
      )}
      className={cn(
        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium",
        level === "high" && "border-sage/40 bg-sage/10 text-sage",
        level === "medium" && "border-copper/40 bg-copper/10 text-copper",
        level === "low" && "border-muted-foreground/30 bg-muted text-muted-foreground",
        className
      )}
    >
      <span>{tierLabel}</span>
      <span className="font-mono opacity-80">{pct}%</span>
    </span>
  );
}
