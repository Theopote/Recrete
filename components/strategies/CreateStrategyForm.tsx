"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { strategySchema, type StrategyFormValues } from "@/lib/validators/project";
import { strategyTypeLabels, strategyTypeLabelsZh, riskLevelLabels, riskLevelLabelsZh } from "@/lib/utils/labels";
import { useLocale } from "@/lib/i18n/use-locale";
import type { StrategyWithMetrics } from "@/types";
import { Plus, X } from "lucide-react";

interface CreateStrategyFormProps {
  projectId: string;
  onCreated: (strategy: StrategyWithMetrics) => void;
}

export function CreateStrategyForm({ projectId, onCreated }: CreateStrategyFormProps) {
  const { t, label } = useLocale();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<StrategyFormValues>({
    resolver: zodResolver(strategySchema),
    defaultValues: {
      type: "medium_renovation",
      costLevel: "medium",
      scheduleLevel: "medium",
      riskLevel: "medium",
      pros: "Preserves existing structure\nModerate cost",
      cons: "Limited design transformation",
    },
  });

  const onSubmit = async (data: StrategyFormValues) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/strategies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const strategy = await res.json();
        onCreated({
          ...strategy,
          createdAt: new Date(strategy.createdAt),
          updatedAt: new Date(strategy.updatedAt),
        });
        reset();
        setOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5 mr-1.5" /> {t("Add Strategy", "添加策略")}
      </Button>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4 col-span-full">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{t("Create Renovation Strategy", "创建改造策略")}</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label={t("Strategy Name", "策略名称")} error={errors.name?.message} className="md:col-span-2">
          <Input {...register("name")} className="h-8 text-xs" placeholder={t("e.g. Heritage-Focused Renewal", "例如：文保导向更新")} />
        </Field>

        <Field label={t("Type", "类型")} error={errors.type?.message}>
          <Select {...register("type")} className="h-8 text-xs">
            {Object.keys(strategyTypeLabels).map((k) => (
              <option key={k} value={k}>
                {label(strategyTypeLabels, strategyTypeLabelsZh, k as keyof typeof strategyTypeLabels)}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={t("Risk Level", "风险等级")} error={errors.riskLevel?.message}>
          <Select {...register("riskLevel")} className="h-8 text-xs">
            {Object.keys(riskLevelLabels).map((k) => (
              <option key={k} value={k}>
                {label(riskLevelLabels, riskLevelLabelsZh, k as keyof typeof riskLevelLabels)}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={t("Cost Level", "成本等级")} error={errors.costLevel?.message}>
          <Select {...register("costLevel")} className="h-8 text-xs">
            <option value="low">{t("Low", "低")}</option>
            <option value="medium">{t("Medium", "中")}</option>
            <option value="high">{t("High", "高")}</option>
          </Select>
        </Field>

        <Field label={t("Schedule Level", "工期等级")} error={errors.scheduleLevel?.message}>
          <Select {...register("scheduleLevel")} className="h-8 text-xs">
            <option value="low">{t("Low", "低")}</option>
            <option value="medium">{t("Medium", "中")}</option>
            <option value="high">{t("High", "高")}</option>
          </Select>
        </Field>

        <Field label={t("Summary", "摘要")} error={errors.summary?.message} className="md:col-span-2">
          <Textarea {...register("summary")} className="text-xs min-h-[48px]" />
        </Field>

        <Field label={t("Design Goal", "设计目标")} error={errors.designGoal?.message}>
          <Textarea {...register("designGoal")} className="text-xs min-h-[48px]" />
        </Field>

        <Field label={t("Spatial Strategy", "空间策略")} error={errors.spatialStrategy?.message}>
          <Textarea {...register("spatialStrategy")} className="text-xs min-h-[48px]" />
        </Field>

        <Field label={t("Structural Strategy", "结构策略")} error={errors.structuralStrategy?.message}>
          <Textarea {...register("structuralStrategy")} className="text-xs min-h-[48px]" />
        </Field>

        <Field label={t("Facade Strategy", "立面策略")} error={errors.facadeStrategy?.message}>
          <Textarea {...register("facadeStrategy")} className="text-xs min-h-[48px]" />
        </Field>

        <Field label={t("MEP Strategy", "机电策略")} error={errors.mepStrategy?.message} className="md:col-span-2">
          <Textarea {...register("mepStrategy")} className="text-xs min-h-[48px]" />
        </Field>

        <Field label={t("Pros (one per line)", "优点（每行一条）")} error={errors.pros?.message}>
          <Textarea {...register("pros")} className="text-xs min-h-[64px]" />
        </Field>

        <Field label={t("Cons (one per line)", "缺点（每行一条）")} error={errors.cons?.message}>
          <Textarea {...register("cons")} className="text-xs min-h-[64px]" />
        </Field>

        <Field label={t("Recommendation Reason (optional)", "推荐理由（可选）")} error={errors.recommendationReason?.message} className="md:col-span-2">
          <Textarea {...register("recommendationReason")} className="text-xs min-h-[40px]" />
        </Field>

        <div className="md:col-span-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>{t("Cancel", "取消")}</Button>
          <Button type="submit" variant="copper" size="sm" disabled={submitting}>
            {submitting ? t("Creating...", "创建中...") : t("Create Strategy", "创建策略")}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <Label className="text-xs">{label}</Label>
      {children}
      {error && <p className="text-[10px] text-destructive">{error}</p>}
    </div>
  );
}
