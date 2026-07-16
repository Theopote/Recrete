"use client";

import Link from "next/link";
import { IssueCard } from "@/components/issues/IssueCard";
import { useLocale } from "@/lib/i18n/use-locale";
import type { IssueWithProject } from "@/types";
import { ExternalLink } from "lucide-react";

interface GlobalIssuesListProps {
  issues: IssueWithProject[];
}

export function GlobalIssuesList({ issues }: GlobalIssuesListProps) {
  const { t } = useLocale();
  const openCount = issues.filter((i) => i.status === "open" || i.status === "in_progress").length;
  const urgentCount = issues.filter((i) => i.priority === "urgent" && i.status !== "closed").length;

  return (
    <div className="space-y-6">
      <div className="flex gap-4 text-xs">
        <Stat label={t("Total Issues", "问题总数")} value={issues.length} />
        <Stat label={t("Open / In Progress", "待处理 / 进行中")} value={openCount} />
        <Stat label={t("Urgent", "紧急")} value={urgentCount} highlight={urgentCount > 0} />
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
