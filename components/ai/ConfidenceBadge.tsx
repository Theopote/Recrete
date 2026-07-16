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

  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-mono font-medium",
        level === "high" && "border-sage/40 bg-sage/10 text-sage",
        level === "medium" && "border-copper/40 bg-copper/10 text-copper",
        level === "low" && "border-muted-foreground/30 bg-muted text-muted-foreground",
        className
      )}
    >
      {pct}% {t("conf.", "置信")}
    </span>
  );
}
