"use client";

import { cn } from "@/lib/utils";
import {
  getProjectStatusColor,
  projectStatusLabels,
  projectStatusLabelsZh,
  diagnosisStatusLabels,
  diagnosisStatusLabelsZh,
  issueStatusLabels,
  issueStatusLabelsZh,
  getDiagnosisStatusColor,
  getIssueStatusColor,
} from "@/lib/utils/labels";
import { useLocale } from "@/lib/i18n/use-locale";
import type { ProjectStatus, DiagnosisStatus, IssueStatus } from "@/types";

interface StatusBadgeProps {
  status: ProjectStatus | DiagnosisStatus | IssueStatus | string;
  type?: "project" | "diagnosis" | "issue";
  className?: string;
}

export function StatusBadge({ status, type = "project", className }: StatusBadgeProps) {
  const { label } = useLocale();

  const colorFn =
    type === "diagnosis"
      ? getDiagnosisStatusColor
      : type === "issue"
        ? getIssueStatusColor
        : getProjectStatusColor;

  const displayLabel =
    type === "project"
      ? label(projectStatusLabels, projectStatusLabelsZh, status as ProjectStatus) ??
        String(status).replace(/_/g, " ")
      : type === "diagnosis"
        ? label(diagnosisStatusLabels, diagnosisStatusLabelsZh, status as DiagnosisStatus) ??
          String(status).replace(/_/g, " ")
        : type === "issue"
          ? label(issueStatusLabels, issueStatusLabelsZh, status as IssueStatus) ??
            String(status).replace(/_/g, " ")
          : String(status).replace(/_/g, " ");

  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium capitalize",
        colorFn(status as never),
        className
      )}
    >
      {displayLabel}
    </span>
  );
}
