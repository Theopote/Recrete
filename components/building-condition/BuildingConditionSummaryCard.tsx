"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, CheckCircle2, CircleDashed, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/use-locale";

interface BuildingConditionSummaryCardProps {
  projectId: string;
}

const DISCIPLINES = [
  { key: "floor_plan", en: "Plans", zh: "平面" },
  { key: "elevation", en: "Elevations", zh: "立面" },
  { key: "structural", en: "Structure", zh: "结构" },
  { key: "mep", en: "MEP", zh: "设备" },
] as const;

export function BuildingConditionSummaryCard({ projectId }: BuildingConditionSummaryCardProps) {
  const { locale, t } = useLocale();
  const [count, setCount] = useState(0);
  const [disciplineCounts, setDisciplineCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/projects/${projectId}/drawing-assets`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setCount(data.count ?? 0);
        setDisciplineCounts(data.disciplineCounts ?? {});
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const label = (en: string, zh: string) => (locale === "zh" ? zh : en);

  return (
    <Card className="group hover:border-copper/30 transition-colors">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-copper" />
            <h3 className="text-sm font-medium">{t("Building Condition", "建筑现状")}</h3>
          </div>
          <a
            href={`/projects/${projectId}?section=building-condition`}
            className="inline-flex items-center gap-0.5 text-[10px] font-medium text-copper hover:underline no-underline"
          >
            {t("Open viewer", "打开现状视图")}
            <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        </div>

        {loading ? (
          <div className="h-8 rounded bg-muted/40 animate-pulse" />
        ) : count === 0 ? (
          <p className="text-xs text-muted-foreground">
            {t(
              "Upload drawings in Survey Intelligence to digitize plans, elevations, structure, and MEP.",
              "在「勘察智能」上传图纸，自动数字化平面、立面、结构与设备资料。"
            )}
          </p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              {t(
                `${count} digitized drawing${count === 1 ? "" : "s"} with AI overlays`,
                `已数字化 ${count} 份图纸，支持 AI 叠加查看`
              )}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {DISCIPLINES.map(({ key, en, zh }) => {
                const ok = (disciplineCounts[key] ?? 0) > 0;
                return (
                  <span
                    key={key}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-medium",
                      ok
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "border-muted-foreground/25 text-muted-foreground"
                    )}
                  >
                    {ok ? (
                      <CheckCircle2 className="h-2.5 w-2.5" />
                    ) : (
                      <CircleDashed className="h-2.5 w-2.5" />
                    )}
                    {label(en, zh)}
                  </span>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
