import { cn } from "@/lib/utils";
import { getProjectStatusColor, projectStatusLabels } from "@/lib/utils/labels";
import type { ProjectStatus, DiagnosisStatus, IssueStatus } from "@/types";
import { getDiagnosisStatusColor, getIssueStatusColor } from "@/lib/utils/labels";

interface StatusBadgeProps {
  status: ProjectStatus | DiagnosisStatus | IssueStatus | string;
  type?: "project" | "diagnosis" | "issue";
  className?: string;
}

export function StatusBadge({ status, type = "project", className }: StatusBadgeProps) {
  const colorFn =
    type === "diagnosis"
      ? getDiagnosisStatusColor
      : type === "issue"
        ? getIssueStatusColor
        : getProjectStatusColor;

  const label =
    type === "project"
      ? projectStatusLabels[status as ProjectStatus] ?? status
      : status.replace(/_/g, " ");

  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium capitalize",
        colorFn(status as never),
        className
      )}
    >
      {label}
    </span>
  );
}
