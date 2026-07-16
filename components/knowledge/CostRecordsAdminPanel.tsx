"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { SectionHeader } from "@/components/app/SectionHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProjectCostRecordWithProject } from "@/types/cost";
import { strategyTypeLabels, strategyTypeLabelsZh } from "@/lib/utils/labels";
import { useLocale } from "@/lib/i18n/use-locale";
import { Loader2 } from "lucide-react";

export function CostRecordsAdminPanel() {
  const { t, label } = useLocale();
  const [records, setRecords] = useState<ProjectCostRecordWithProject[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/knowledge/cost-records");
      if (!res.ok) return;
      const data = await res.json();
      setRecords(
        (data.records ?? []).map((r: ProjectCostRecordWithProject) => ({
          ...r,
          recordedAt: new Date(r.recordedAt),
          createdAt: new Date(r.createdAt),
        }))
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Completed Project Costs"
        titleZh="完工项目造价库"
        description="All recorded actual costs feeding regional benchmark calibration"
        descriptionZh="全部完工造价记录，用于区域基准库自动校准"
      />

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("Loading…", "加载中…")}
        </div>
      ) : records.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-xs text-muted-foreground">
            {t(
              "No cost records yet. Record costs from a project's Cost & Risk section.",
              "暂无造价记录。请在项目的「成本与风险」板块录入完工造价。"
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("Project", "项目")}</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("Region", "区域")}</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("Strategy", "方案")}</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">¥/m²</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t("Total", "总价")}</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">{t("Outcome", "结果")}</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    {r.projectName ? (
                      <Link
                        href={`/projects/${r.projectId}?section=cost-risk`}
                        className="font-medium text-copper hover:underline"
                      >
                        {r.projectName}
                      </Link>
                    ) : (
                      r.projectId
                    )}
                    <p className="text-[10px] text-muted-foreground">{r.projectLocation}</p>
                  </td>
                  <td className="px-4 py-3">{r.region}{r.city ? ` · ${r.city}` : ""}</td>
                  <td className="px-4 py-3">
                    {r.strategyType
                      ? label(strategyTypeLabels, strategyTypeLabelsZh, r.strategyType)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">
                    ¥{r.actualCostPerSqm.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    ¥{r.actualTotalCost.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="outline" className="text-[10px]">
                      {r.outcome}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
