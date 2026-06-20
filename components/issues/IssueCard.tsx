import { Card, CardContent } from "@/components/ui/card";
import {
  issueCategoryLabels,
  issuePriorityLabels,
  getIssuePriorityColor,
} from "@/lib/utils/labels";
import { StatusBadge } from "@/components/app/StatusBadge";
import { formatDate } from "@/lib/utils";
import { getUserById } from "@/lib/mock-data";
import type { SiteIssue } from "@/types";
import { MapPin, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface IssueCardProps {
  issue: SiteIssue;
  compact?: boolean;
  onStatusChange?: (status: SiteIssue["status"]) => void;
}

export function IssueCard({ issue, compact, onStatusChange }: IssueCardProps) {
  const assignee = issue.assignedToId ? getUserById(issue.assignedToId) : null;
  const isOverdue = issue.dueDate && issue.dueDate < new Date() && issue.status !== "resolved" && issue.status !== "closed";

  return (
    <Card className={cn("hover:border-copper/20 transition-colors", isOverdue && "border-destructive/30")}>
      <CardContent className={cn("p-4", compact && "p-3")}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="text-sm font-medium leading-tight">{issue.title}</h4>
          <StatusBadge status={issue.status} type="issue" />
        </div>

        <div className="flex flex-wrap gap-1.5 mb-2">
          <span className={cn("inline-flex rounded px-2 py-0.5 text-[10px] font-medium", getIssuePriorityColor(issue.priority))}>
            {issuePriorityLabels[issue.priority]}
          </span>
          <span className="inline-flex rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {issueCategoryLabels[issue.category]}
          </span>
        </div>

        {!compact && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{issue.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
          {issue.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {issue.location}
            </span>
          )}
          {issue.dueDate && (
            <span className={cn("flex items-center gap-1", isOverdue && "text-destructive font-medium")}>
              <Calendar className="h-3 w-3" /> {formatDate(issue.dueDate)}
            </span>
          )}
          {assignee && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" /> {assignee.name}
            </span>
          )}
        </div>

        {onStatusChange && issue.status !== "closed" && (
          <div className="mt-3 flex gap-1.5">
            {issue.status === "open" && (
              <button
                onClick={() => onStatusChange("in_progress")}
                className="text-[10px] px-2 py-1 rounded bg-muted hover:bg-muted/80 font-medium"
              >
                Start
              </button>
            )}
            {(issue.status === "open" || issue.status === "in_progress") && (
              <button
                onClick={() => onStatusChange("resolved")}
                className="text-[10px] px-2 py-1 rounded bg-sage/10 text-sage hover:bg-sage/20 font-medium"
              >
                Resolve
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
