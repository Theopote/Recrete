"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  diagnosisItemSchema,
  type DiagnosisItemFormValues,
} from "@/lib/validators/project";
import {
  diagnosisCategoryLabels,
  diagnosisCategoryLabelsZh,
  severityLabels,
  severityLabelsZh,
  diagnosisStatusLabels,
  diagnosisStatusLabelsZh,
} from "@/lib/utils/labels";
import { useLocale } from "@/lib/i18n/use-locale";
import type { DiagnosisItem } from "@/types";
import { X } from "lucide-react";

interface DiagnosisFormDialogProps {
  projectId: string;
  item?: DiagnosisItem | null;
  open: boolean;
  onClose: () => void;
  onSaved: (item: DiagnosisItem) => void;
}

export function DiagnosisFormDialog({
  projectId,
  item,
  open,
  onClose,
  onSaved,
}: DiagnosisFormDialogProps) {
  const { t, label } = useLocale();
  const isEdit = !!item;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DiagnosisItemFormValues>({
    resolver: zodResolver(diagnosisItemSchema),
    defaultValues: {
      severity: "medium",
      status: "identified",
      category: "architecture",
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        item
          ? {
              title: item.title,
              category: item.category,
              severity: item.severity,
              status: item.status,
              description: item.description,
              evidence: item.evidence ?? "",
              recommendation: item.recommendation ?? "",
              relatedLocation: item.relatedLocation ?? "",
            }
          : {
              title: "",
              category: "architecture",
              severity: "medium",
              status: "identified",
              description: "",
              evidence: "",
              recommendation: "",
              relatedLocation: "",
            }
      );
    }
  }, [open, item, reset]);

  if (!open) return null;

  const onSubmit = async (data: DiagnosisItemFormValues) => {
    const url = isEdit
      ? `/api/projects/${projectId}/diagnosis/${item!.id}`
      : `/api/projects/${projectId}/diagnosis`;
    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const saved = await res.json();
      onSaved({
        ...saved,
        createdAt: new Date(saved.createdAt),
        updatedAt: new Date(saved.updatedAt),
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3 sticky top-0 bg-card">
          <h3 className="text-sm font-medium">
            {isEdit ? t("Edit Diagnosis Item", "编辑诊断条目") : t("Add Diagnosis Item", "添加诊断条目")}
          </h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-3">
          <Field label={t("Title", "标题")} error={errors.title?.message}>
            <Input {...register("title")} className="h-8 text-xs" />
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label={t("Category", "专业")} error={errors.category?.message}>
              <Select {...register("category")} className="h-8 text-xs">
                {Object.keys(diagnosisCategoryLabels).map((k) => (
                  <option key={k} value={k}>
                    {label(
                      diagnosisCategoryLabels,
                      diagnosisCategoryLabelsZh,
                      k as keyof typeof diagnosisCategoryLabels
                    )}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("Severity", "严重度")} error={errors.severity?.message}>
              <Select {...register("severity")} className="h-8 text-xs">
                {Object.keys(severityLabels).map((k) => (
                  <option key={k} value={k}>
                    {label(severityLabels, severityLabelsZh, k as keyof typeof severityLabels)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("Status", "状态")} error={errors.status?.message}>
              <Select {...register("status")} className="h-8 text-xs">
                {Object.keys(diagnosisStatusLabels).map((k) => (
                  <option key={k} value={k}>
                    {label(
                      diagnosisStatusLabels,
                      diagnosisStatusLabelsZh,
                      k as keyof typeof diagnosisStatusLabels
                    )}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label={t("Description", "描述")} error={errors.description?.message}>
            <Textarea {...register("description")} className="text-xs min-h-[72px]" />
          </Field>

          <Field label={t("Evidence", "依据")} error={errors.evidence?.message}>
            <Textarea {...register("evidence")} className="text-xs min-h-[48px]" />
          </Field>

          <Field label={t("Recommendation", "建议")} error={errors.recommendation?.message}>
            <Textarea {...register("recommendation")} className="text-xs min-h-[48px]" />
          </Field>

          <Field label={t("Related Location", "相关位置")} error={errors.relatedLocation?.message}>
            <Input
              {...register("relatedLocation")}
              className="h-8 text-xs"
              placeholder={t("e.g. South elevation, 3F", "例如：南立面、3 层")}
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              {t("Cancel", "取消")}
            </Button>
            <Button type="submit" variant="copper" size="sm" disabled={isSubmitting}>
              {isSubmitting
                ? t("Saving...", "保存中...")
                : isEdit
                  ? t("Save Changes", "保存修改")
                  : t("Add Item", "添加条目")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
      {error && <p className="text-[10px] text-destructive">{error}</p>}
    </div>
  );
}
