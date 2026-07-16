"use client";

import { useState } from "react";
import { IssueCard } from "@/components/issues/IssueCard";
import { CreateIssueForm } from "@/components/issues/CreateIssueForm";
import { RoleGate } from "@/components/auth/RoleGate";
import { SectionHeader } from "@/components/app/SectionHeader";
import { EmptyState } from "@/components/app/EmptyState";
import type { ProjectWithRelations, IssueStatus, SiteIssue } from "@/types";
import { issueStatusLabels, issueStatusLabelsZh } from "@/lib/utils/labels";
import { useLocale } from "@/lib/i18n/use-locale";
import { AlertTriangle } from "lucide-react";

const STATUSES: IssueStatus[] = ["open", "in_progress", "resolved", "closed"];

interface IssuesSectionProps {
  project: ProjectWithRelations;
}

export function IssuesSection({ project: initialProject }: IssuesSectionProps) {
  const { t, label } = useLocale();
  const [issues, setIssues] = useState(initialProject.issues ?? []);

  const handleStatusChange = async (issueId: string, status: IssueStatus) => {
    const res = await fetch(`/api/projects/${initialProject.id}/issues/${issueId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setIssues((prev) =>
        prev.map((i) =>
          i.id === issueId
            ? {
                ...updated,
                createdAt: new Date(updated.createdAt),
                updatedAt: new Date(updated.updatedAt),
                dueDate: updated.dueDate ? new Date(updated.dueDate) : null,
              }
            : i
        )
      );
    }
  };

  const handleCreated = (issue: SiteIssue) => {
    setIssues((prev) => [issue, ...prev]);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Site Issue Tracker"
        titleZh="现场问题跟踪"
        description="Track and manage on-site findings and construction issues"
        descriptionZh="跟踪与管理现场发现及施工问题"
        action={
          <RoleGate action="manage_issues">
            <CreateIssueForm projectId={initialProject.id} onCreated={handleCreated} />
          </RoleGate>
        }
      />

      {issues.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {STATUSES.map((status) => {
            const columnIssues = issues.filter((i) => i.status === status);
            return (
              <div key={status} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {label(issueStatusLabels, issueStatusLabelsZh, status)}
                  </h3>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {columnIssues.length}
                  </span>
                </div>
                <div className="space-y-2 min-h-[120px]">
                  {columnIssues.map((issue) => (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      onStatusChange={(s) => handleStatusChange(issue.id, s)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={AlertTriangle}
          title={t("No site issues", "暂无现场问题")}
          description={t(
            "Report site issues as they are identified during survey and construction.",
            "在勘察与施工过程中记录现场问题。"
          )}
        />
      )}
    </div>
  );
}
