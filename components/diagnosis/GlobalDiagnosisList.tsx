"use client";

import Link from "next/link";
import { DiagnosisCard } from "@/components/diagnosis/DiagnosisCard";
import { useLocale } from "@/lib/i18n/use-locale";
import type { DiagnosisWithProject } from "@/types";
import { ExternalLink } from "lucide-react";

interface GlobalDiagnosisListProps {
  items: DiagnosisWithProject[];
}

export function GlobalDiagnosisList({ items }: GlobalDiagnosisListProps) {
  const { t } = useLocale();
  const criticalCount = items.filter(
    (i) => i.severity === "critical" || i.severity === "high"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex gap-4 text-xs">
        <Stat label={t("Total Items", "总条目")} value={items.length} />
        <Stat label={t("Critical / High", "严重 / 高")} value={criticalCount} highlight />
        <Stat label={t("Categories", "专业数")} value={new Set(items.map((i) => i.category)).size} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item.id} className="relative">
            <Link
              href={`/projects/${item.projectId}?section=diagnosis`}
              className="absolute top-3 right-3 z-10 flex items-center gap-1 text-[10px] text-copper hover:underline"
            >
              {item.projectName} <ExternalLink className="h-3 w-3" />
            </Link>
            <DiagnosisCard item={item} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="rounded-md border px-4 py-3">
      <p className="text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold tabular-nums ${highlight ? "text-destructive" : ""}`}>
        {value}
      </p>
    </div>
  );
}
