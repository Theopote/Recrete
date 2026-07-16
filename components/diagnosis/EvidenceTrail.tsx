"use client";

import { Badge } from "@/components/ui/badge";
import { FileText, Camera, AlertCircle } from "lucide-react";
import type { SourceEvidence } from "@/types/ai";

interface EvidenceTrailProps {
  evidence: SourceEvidence[];
  documentNames?: Record<string, string>;
  maxItems?: number;
}

const sourceTypeLabels: Record<SourceEvidence["sourceType"], string> = {
  document: "文档",
  photo: "照片",
  site_issue: "现场问题",
  user_note: "备注",
  meeting_record: "会议记录",
  diagnosis: "诊断",
};

export function EvidenceTrail({ evidence, documentNames = {}, maxItems = 5 }: EvidenceTrailProps) {
  if (evidence.length === 0) return null;

  const items = evidence.slice(0, maxItems);

  return (
    <div className="rounded bg-muted/40 px-3 py-2 space-y-2">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        证据来源 ({evidence.length})
      </p>
      <ul className="space-y-1.5">
        {items.map((ev) => (
          <li key={ev.id} className="flex items-start gap-2 text-xs">
            {ev.sourceType === "photo" ? (
              <Camera className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
            ) : (
              <FileText className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                  {sourceTypeLabels[ev.sourceType]}
                </Badge>
                {ev.locationLabel && (
                  <span className="text-muted-foreground truncate">{ev.locationLabel}</span>
                )}
                {ev.documentId && documentNames[ev.documentId] && (
                  <span className="text-muted-foreground truncate">
                    · {documentNames[ev.documentId]}
                  </span>
                )}
              </div>
              {ev.quote && (
                <p className="mt-0.5 text-foreground/80 line-clamp-2">&ldquo;{ev.quote}&rdquo;</p>
              )}
            </div>
          </li>
        ))}
      </ul>
      {evidence.length > maxItems && (
        <p className="text-[10px] text-muted-foreground">
          另有 {evidence.length - maxItems} 条证据未显示
        </p>
      )}
    </div>
  );
}

export function EngineerReviewBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
      <AlertCircle className="h-3 w-3" />
      需工程师审核
    </span>
  );
}
