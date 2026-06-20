"use client";

import Link from "next/link";
import { IssueCard } from "@/components/issues/IssueCard";
import type { IssueWithProject } from "@/types";
import { ExternalLink } from "lucide-react";

interface GlobalIssuesListProps {
  issues: IssueWithProject[];
}

export function GlobalIssuesList({ issues }: GlobalIssuesListProps) {
  const openCount = issues.filter((i) => i.status === "open" || i.status === "in_progress").length;
  const urgentCount = issues.filter((i) => i.priority === "urgent" && i.status !== "closed").length;

  return (
    <div className="space-y-6">
      <div className="flex gap-4 text-xs">
        <Stat label="Total Issues" value={issues.length} />
        <Stat label="Open / In Progress" value={openCount} />
        <Stat label="Urgent" value={urgentCount} highlight={urgentCount > 0} />
      </div>

      <div className="space-y-3">
        {issues.map((issue) => (
          <div key={issue.id} className="relative">
            <Link
              href={`/projects/${issue.projectId}?section=issues`}
              className="absolute top-3 right-3 z-10 flex items-center gap-1 text-[10px] text-copper hover:underline"
            >
              {issue.projectName} <ExternalLink className="h-3 w-3" />
            </Link>
            <IssueCard issue={issue} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="rounded-md border px-4 py-3">
      <p className="text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold tabular-nums ${highlight ? "text-destructive" : ""}`}>{value}</p>
    </div>
  );
}
