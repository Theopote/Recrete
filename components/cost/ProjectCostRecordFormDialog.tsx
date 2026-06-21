"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  COST_RECORD_OUTCOMES,
  projectCostRecordSchema,
  type ProjectCostRecordFormValues,
} from "@/lib/validators/project-cost-record";
import type { ProjectCostRecord, BenchmarkCalibrationResult } from "@/types/cost";
import type { RenovationStrategy, StrategyType } from "@/types";
import { strategyTypeLabels } from "@/lib/utils/labels";
import { X } from "lucide-react";

const ALL_STRATEGY_TYPES: StrategyType[] = [
  "light_renewal",
  "medium_renovation",
  "deep_recreation",
  "adaptive_reuse",
  "facade_upgrade",
  "energy_retrofit",
  "safety_upgrade",
];

interface ProjectCostRecordFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: (result: { record: ProjectCostRecord; calibration?: BenchmarkCalibrationResult }) => void;
  projectId: string;
  grossFloorArea: number;
  strategies?: RenovationStrategy[];
  item?: ProjectCostRecord | null;
}

export function ProjectCostRecordFormDialog({
  open,
  onClose,
  onSaved,
  projectId,
  grossFloorArea,
  strategies = [],
  item,
}: ProjectCostRecordFormDialogProps) {
  const isEdit = !!item;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProjectCostRecordFormValues>({
    resolver: zodResolver(projectCostRecordSchema),
    defaultValues: {
      outcome: "success",
      markCompleted: false,
    },
  });

  const totalCost = watch("actualTotalCost");

  useEffect(() => {
    if (open) {
      reset(
        item
          ? {
              strategyType: item.strategyType ?? undefined,
              actualCostPerSqm: item.actualCostPerSqm,
              actualTotalCost: item.actualTotalCost,
              durationMonths: item.durationMonths ?? undefined,
              outcome: item.outcome,
              notes: item.notes ?? undefined,
              markCompleted: false,
            }
          : {
              strategyType: strategies[0]?.type,
              actualCostPerSqm: 0,
              actualTotalCost: 0,
              durationMonths: undefined,
              outcome: "success",
              notes: "",
              markCompleted: false,
            }
      );
    }
  }, [open, item, reset, strategies]);

  useEffect(() => {
    if (!open || isEdit) return;
    const total = Number(totalCost);
    if (total > 0 && grossFloorArea > 0) {
      setValue("actualCostPerSqm", Math.round(total / grossFloorArea));
    }
  }, [totalCost, grossFloorArea, setValue, open, isEdit]);

  if (!open) return null;

  const strategyOptions = [
    ...strategies.map((s) => ({ value: s.type, label: s.name })),
    ...ALL_STRATEGY_TYPES.filter((t) => !strategies.some((s) => s.type === t)).map((t) => ({
      value: t,
      label: strategyTypeLabels[t] ?? t,
    })),
  ];

  const onSubmit = async (data: ProjectCostRecordFormValues) => {
    const url = isEdit
      ? `/api/projects/${projectId}/cost-records/${item!.id}`
      : `/api/projects/${projectId}/cost-records`;
    const res = await fetch(url, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const result = await res.json();
      onSaved(result);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-lg border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-medium">
            {isEdit ? "Edit Actual Cost · 编辑实际造价" : "Record Actual Cost · 录入完工造价"}
          </h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-3">
          <Field label="Strategy Type · 策略类型" error={errors.strategyType?.message}>
            <Select {...register("strategyType")} className="h-8 text-xs">
              {strategyOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={`Total Cost (¥) · 总造价`} error={errors.actualTotalCost?.message}>
              <Input type="number" step="1000" {...register("actualTotalCost")} className="h-8 text-xs" />
            </Field>
            <Field
              label={`Unit Cost (¥/m²) · 单方造价`}
              error={errors.actualCostPerSqm?.message}
            >
              <Input type="number" step="1" {...register("actualCostPerSqm")} className="h-8 text-xs" />
            </Field>
          </div>

          <p className="text-[10px] text-muted-foreground -mt-1">
            GFA {grossFloorArea.toLocaleString()} m² — total ÷ area auto-fills unit cost
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Duration (months) · 工期" error={errors.durationMonths?.message}>
              <Input type="number" {...register("durationMonths")} className="h-8 text-xs" />
            </Field>
            <Field label="Outcome · 结果" error={errors.outcome?.message}>
              <Select {...register("outcome")} className="h-8 text-xs">
                {COST_RECORD_OUTCOMES.map((o) => (
                  <option key={o} value={o}>
                    {o === "success" ? "Success · 成功" : o === "partial" ? "Partial · 部分" : "Failure · 失败"}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Notes · 备注" error={errors.notes?.message}>
            <Textarea {...register("notes")} className="text-xs min-h-[64px]" placeholder="Variance reasons, scope changes…" />
          </Field>

          {!isEdit && (
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" {...register("markCompleted")} className="rounded border-input" />
              Mark project as completed · 同时将项目标记为已完工
            </label>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="copper" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEdit ? "Save" : "Record Cost"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
      {error && <p className="text-[10px] text-destructive">{error}</p>}
    </div>
  );
}
