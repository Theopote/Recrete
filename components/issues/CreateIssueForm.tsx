"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { siteIssueSchema, type SiteIssueFormValues } from "@/lib/validators/project";
import {
  issueCategoryLabels,
  issueCategoryLabelsZh,
  issuePriorityLabels,
  issuePriorityLabelsZh,
} from "@/lib/utils/labels";
import { useLocale } from "@/lib/i18n/use-locale";
import { Plus, X } from "lucide-react";
import type { SiteIssue } from "@/types";

interface CreateIssueFormProps {
  projectId: string;
  onCreated: (issue: SiteIssue) => void;
}

export function CreateIssueForm({ projectId, onCreated }: CreateIssueFormProps) {
  const { t, label } = useLocale();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SiteIssueFormValues>({
    resolver: zodResolver(siteIssueSchema),
    defaultValues: { priority: "medium", category: "other" },
  });

  const onSubmit = async (data: SiteIssueFormValues) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const issue = await res.json();
        onCreated({
          ...issue,
          createdAt: new Date(issue.createdAt),
          updatedAt: new Date(issue.updatedAt),
          dueDate: issue.dueDate ? new Date(issue.dueDate) : null,
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
        <Plus className="h-3.5 w-3.5 mr-1.5" /> {t("New Issue", "新建问题")}
      </Button>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{t("Report Site Issue", "上报现场问题")}</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2 space-y-1">
          <Label>{t("Title", "标题")}</Label>
          <Input
            {...register("title")}
            placeholder={t("Brief issue title", "简要问题标题")}
            className="h-8 text-xs"
          />
          {errors.title && <p className="text-[10px] text-destructive">{errors.title.message}</p>}
        </div>
        <div className="space-y-1">
          <Label>{t("Category", "类别")}</Label>
          <Select {...register("category")} className="h-8 text-xs">
            {Object.keys(issueCategoryLabels).map((k) => (
              <option key={k} value={k}>
                {label(
                  issueCategoryLabels,
                  issueCategoryLabelsZh,
                  k as keyof typeof issueCategoryLabels
                )}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label>{t("Priority", "优先级")}</Label>
          <Select {...register("priority")} className="h-8 text-xs">
            {Object.keys(issuePriorityLabels).map((k) => (
              <option key={k} value={k}>
                {label(
                  issuePriorityLabels,
                  issuePriorityLabelsZh,
                  k as keyof typeof issuePriorityLabels
                )}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label>{t("Location", "位置")}</Label>
          <Input
            {...register("location")}
            placeholder={t("Floor, grid, elevation", "楼层、轴线、标高")}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label>{t("Due Date", "截止日期")}</Label>
          <Input type="date" {...register("dueDate")} className="h-8 text-xs" />
        </div>
        <div className="md:col-span-2 space-y-1">
          <Label>{t("Description", "描述")}</Label>
          <Textarea
            {...register("description")}
            placeholder={t("Describe the issue...", "描述问题详情…")}
            className="text-xs min-h-[60px]"
          />
          {errors.description && (
            <p className="text-[10px] text-destructive">{errors.description.message}</p>
          )}
        </div>
        <div className="md:col-span-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
            {t("Cancel", "取消")}
          </Button>
          <Button type="submit" variant="copper" size="sm" disabled={submitting}>
            {submitting ? t("Creating...", "创建中...") : t("Create Issue", "创建问题")}
          </Button>
        </div>
      </form>
    </div>
  );
}
