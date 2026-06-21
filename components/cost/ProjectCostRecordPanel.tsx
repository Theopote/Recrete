"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SectionHeader } from "@/components/app/SectionHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProjectCostRecordFormDialog } from "@/components/cost/ProjectCostRecordFormDialog";
import type { ProjectWithRelations } from "@/types";
import type { BenchmarkCalibrationResult, ProjectCostRecord } from "@/types/cost";
import { strategyTypeLabels } from "@/lib/utils/labels";
import { cn } from "@/lib/utils";
import { ClipboardCheck, Loader2, Pencil, Plus, Trash2 } from "lucide-react";

interface ProjectCostRecordPanelProps {
  project: ProjectWithRelations;
}

const outcomeStyles: Record<string, string> = {
  success: "bg-sage/15 text-sage border-sage/30",
  partial: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  failure: "bg-red-500/15 text-red-700 border-red-500/30",
};

export function ProjectCostRecordPanel({ project }: ProjectCostRecordPanelProps) {
  const router = useRouter();
  const [records, setRecords] = useState<ProjectCostRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectCostRecord | null>(null);
  const [calibration, setCalibration] = useState<BenchmarkCalibrationResult | null>(null);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/cost-records`);
      if (!res.ok) return;
      const data = await res.json();
      setRecords(
        (data.records ?? []).map((r: ProjectCostRecord) => ({
          ...r,
          recordedAt: new Date(r.recordedAt),
          createdAt: new Date(r.createdAt),
        }))
      );
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this cost record? Benchmark calibration will be recalculated.")) return;
    const res = await fetch(`/api/projects/${project.id}/cost-records/${id}`, { method: "DELETE" });
    if (res.ok) {
      const data = await res.json();
      setRecords((prev) => prev.filter((r) => r.id !== id));
      if (data.calibration) setCalibration(data.calibration);
    }
  };

  const handleSaved = (result: {
    record: ProjectCostRecord;
    calibration?: BenchmarkCalibrationResult;
  }) => {
    const record = {
      ...result.record,
      recordedAt: new Date(result.record.recordedAt),
      createdAt: new Date(result.record.createdAt),
    };
    setRecords((prev) => {
      const exists = prev.some((r) => r.id === record.id);
      if (exists) return prev.map((r) => (r.id === record.id ? record : r));
      return [record, ...prev];
    });
    if (result.calibration) setCalibration(result.calibration);
    router.refresh();
  };

  const isCompleted = project.status === "completed";

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Actual Cost Records"
        titleZh="完工造价录入"
        description="Record final renovation costs to calibrate regional benchmarks for future AI estimates"
        descriptionZh="录入实际改造造价，自动校准区域造价基准，提升后续 AI 估算精度"
        action={
          <Button
            variant="copper"
            size="sm"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Record Cost
          </Button>
        }
      />

      {!isCompleted && (
        <Card className="border-copper/30 bg-copper/5">
          <CardContent className="p-3 text-xs text-muted-foreground flex items-start gap-2">
            <ClipboardCheck className="h-4 w-4 text-copper shrink-0 mt-0.5" />
            <span>
              Project status: <strong className="text-foreground">{project.status}</strong>.
              You can record costs at any phase; check &quot;Mark as completed&quot; when handover is done.
              可在任何阶段录入；完工验收时勾选「标记为已完工」。
            </span>
          </CardContent>
        </Card>
      )}

      {calibration && calibration.updatedCount > 0 && (
        <Card className="border-sage/40 bg-sage/5">
          <CardContent className="p-3 text-xs">
            <p className="font-medium text-sage mb-1">
              Benchmark calibrated · 基准库已更新 ({calibration.updatedCount} entries)
            </p>
            <ul className="space-y-0.5 text-muted-foreground">
              {calibration.benchmarks.slice(0, 3).map((b) => (
                <li key={b.id}>
                  {b.region} · {b.buildingType} · {strategyTypeLabels[b.strategyType as keyof typeof strategyTypeLabels] ?? b.strategyType}:
                  ¥{b.costPerSqmMin.toLocaleString()}–{b.costPerSqmMax.toLocaleString()}/m² (n={b.sampleSize})
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading cost records…
        </div>
      ) : records.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-xs text-muted-foreground">
            No actual cost records yet. Record final costs after construction to improve AI predictions.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {records.map((record) => (
            <Card key={record.id}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge variant="outline" className={cn("text-[10px]", outcomeStyles[record.outcome])}>
                        {record.outcome}
                      </Badge>
                      {record.strategyType && (
                        <span className="text-[10px] text-muted-foreground">
                          {strategyTypeLabels[record.strategyType as keyof typeof strategyTypeLabels] ?? record.strategyType}
                        </span>
                      )}
                    </div>
                    <p className="text-lg font-semibold tabular-nums">
                      ¥{record.actualTotalCost.toLocaleString()}
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        ~¥{record.actualCostPerSqm.toLocaleString()}/m²
                      </span>
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {record.region}
                      {record.city ? ` · ${record.city}` : ""} · {record.buildingType}
                      {record.durationMonths ? ` · ${record.durationMonths} months` : ""}
                      {" · "}
                      {new Date(record.recordedAt).toLocaleDateString()}
                    </p>
                    {record.notes && (
                      <p className="text-xs text-muted-foreground mt-2">{record.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setEditing(record);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleDelete(record.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ProjectCostRecordFormDialog
        open={dialogOpen}
        projectId={project.id}
        grossFloorArea={project.grossFloorArea}
        strategies={project.strategies ?? []}
        item={editing}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
        onSaved={handleSaved}
      />
    </div>
  );
}
