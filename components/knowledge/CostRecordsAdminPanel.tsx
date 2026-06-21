"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { SectionHeader } from "@/components/app/SectionHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProjectCostRecordWithProject } from "@/types/cost";
import { strategyTypeLabels } from "@/lib/utils/labels";
import { Loader2 } from "lucide-react";

export function CostRecordsAdminPanel() {
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
          Loading…
        </div>
      ) : records.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-xs text-muted-foreground">
            No cost records yet. Record costs from a project&apos;s Cost &amp; Risk section.
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Project</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Region</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Strategy</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">¥/m²</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Outcome</th>
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
                      ? strategyTypeLabels[r.strategyType as keyof typeof strategyTypeLabels] ?? r.strategyType
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
