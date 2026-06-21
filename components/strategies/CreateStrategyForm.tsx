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
import { strategyTypeLabels, riskLevelLabels } from "@/lib/utils/labels";
import type { StrategyWithMetrics } from "@/types";
import { Plus, X } from "lucide-react";

interface CreateStrategyFormProps {
  projectId: string;
  onCreated: (strategy: StrategyWithMetrics) => void;
}

export function CreateStrategyForm({ projectId, onCreated }: CreateStrategyFormProps) {
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
        <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Strategy
      </Button>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4 col-span-full">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Create Renovation Strategy</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Strategy Name" error={errors.name?.message} className="md:col-span-2">
          <Input {...register("name")} className="h-8 text-xs" placeholder="e.g. Heritage-Focused Renewal" />
        </Field>

        <Field label="Type" error={errors.type?.message}>
          <Select {...register("type")} className="h-8 text-xs">
            {Object.entries(strategyTypeLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        </Field>

        <Field label="Risk Level" error={errors.riskLevel?.message}>
          <Select {...register("riskLevel")} className="h-8 text-xs">
            {Object.entries(riskLevelLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        </Field>

        <Field label="Cost Level" error={errors.costLevel?.message}>
          <Select {...register("costLevel")} className="h-8 text-xs">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </Select>
        </Field>

        <Field label="Schedule Level" error={errors.scheduleLevel?.message}>
          <Select {...register("scheduleLevel")} className="h-8 text-xs">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </Select>
        </Field>

        <Field label="Summary" error={errors.summary?.message} className="md:col-span-2">
          <Textarea {...register("summary")} className="text-xs min-h-[48px]" />
        </Field>

        <Field label="Design Goal" error={errors.designGoal?.message}>
          <Textarea {...register("designGoal")} className="text-xs min-h-[48px]" />
        </Field>

        <Field label="Spatial Strategy" error={errors.spatialStrategy?.message}>
          <Textarea {...register("spatialStrategy")} className="text-xs min-h-[48px]" />
        </Field>

        <Field label="Structural Strategy" error={errors.structuralStrategy?.message}>
          <Textarea {...register("structuralStrategy")} className="text-xs min-h-[48px]" />
        </Field>

        <Field label="Facade Strategy" error={errors.facadeStrategy?.message}>
          <Textarea {...register("facadeStrategy")} className="text-xs min-h-[48px]" />
        </Field>

        <Field label="MEP Strategy" error={errors.mepStrategy?.message} className="md:col-span-2">
          <Textarea {...register("mepStrategy")} className="text-xs min-h-[48px]" />
        </Field>

        <Field label="Pros (one per line)" error={errors.pros?.message}>
          <Textarea {...register("pros")} className="text-xs min-h-[64px]" />
        </Field>

        <Field label="Cons (one per line)" error={errors.cons?.message}>
          <Textarea {...register("cons")} className="text-xs min-h-[64px]" />
        </Field>

        <Field label="Recommendation Reason (optional)" error={errors.recommendationReason?.message} className="md:col-span-2">
          <Textarea {...register("recommendationReason")} className="text-xs min-h-[40px]" />
        </Field>

        <div className="md:col-span-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit" variant="copper" size="sm" disabled={submitting}>
            {submitting ? "Creating..." : "Create Strategy"}
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
