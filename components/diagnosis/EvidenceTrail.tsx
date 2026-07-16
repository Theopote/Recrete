"use client";

import { Badge } from "@/components/ui/badge";
import { FileText, Camera, AlertCircle } from "lucide-react";
import type { SourceEvidence } from "@/types/ai";
import { useLocale } from "@/lib/i18n/use-locale";

interface EvidenceTrailProps {
  evidence: SourceEvidence[];
  documentNames?: Record<string, string>;
  maxItems?: number;
}

const sourceTypeLabels: Record<SourceEvidence["sourceType"], { en: string; zh: string }> = {
  document: { en: "Document", zh: "文档" },
  photo: { en: "Photo", zh: "照片" },
  site_issue: { en: "Site Issue", zh: "现场问题" },
  user_note: { en: "Note", zh: "备注" },
  meeting_record: { en: "Meeting", zh: "会议记录" },
  diagnosis: { en: "Diagnosis", zh: "诊断" },
};

export function EvidenceTrail({ evidence, documentNames = {}, maxItems = 5 }: EvidenceTrailProps) {
  const { t } = useLocale();
  if (evidence.length === 0) return null;

  const items = evidence.slice(0, maxItems);

  return (
    <div className="rounded bg-muted/40 px-3 py-2 space-y-2">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {t("Evidence Sources", "证据来源")} ({evidence.length})
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
                  {t(sourceTypeLabels[ev.sourceType].en, sourceTypeLabels[ev.sourceType].zh)}
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
          {t(
            `${evidence.length - maxItems} more evidence items not shown`,
            `另有 ${evidence.length - maxItems} 条证据未显示`
          )}
        </p>
      )}
    </div>
  );
}

export function EngineerReviewBadge() {
  const { t } = useLocale();
  return (
    <span className="inline-flex items-center gap-1 rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
      <AlertCircle className="h-3 w-3" />
      {t("Engineer review required", "需工程师审核")}
    </span>
  );
}
