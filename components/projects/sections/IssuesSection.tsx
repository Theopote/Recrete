"use client";

import { useState } from "react";
import { IssueCard } from "@/components/issues/IssueCard";
import { SectionHeader } from "@/components/app/SectionHeader";
import { EmptyState } from "@/components/app/EmptyState";
import type { ProjectWithRelations, IssueStatus } from "@/types";
import { issueStatusLabels } from "@/lib/utils/labels";
import { AlertTriangle } from "lucide-react";

const STATUSES: IssueStatus[] = ["open", "in_progress", "resolved", "closed"];

interface IssuesSectionProps {
  project: ProjectWithRelations;
}

export function IssuesSection({ project: initialProject }: IssuesSectionProps) {
  const [issues, setIssues] = useState(initialProject.issues ?? []);

  const handleStatusChange = async (issueId: string, status: IssueStatus) => {
    const res = await fetch(`/api/projects/${initialProject.id}/issues/${issueId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setIssues((prev) => prev.map((i) => (i.id === issueId ? updated : i)));
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Site Issue Tracker"
        description="Track and manage on-site findings and construction issues"
      />

      {issues.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {STATUSES.map((status) => {
            const columnIssues = issues.filter((i) => i.status === status);
            return (
              <div key={status} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {issueStatusLabels[status]}
                  </h3>
                  <span className="text-xs text-muted-foreground tabular-nums">{columnIssues.length}</span>
                </div>
                <div className="space-y-2 min-h-[200px]">
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
          title="No site issues"
          description="Site issues will appear here as they are identified during survey and construction."
        />
      )}
    </div>
  );
}
