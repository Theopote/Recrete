"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  diagnosisCategoryLabels,
  diagnosisCategoryLabelsZh,
  diagnosisStatusLabels,
  diagnosisStatusLabelsZh,
  severityLabels,
  severityLabelsZh,
  getSeverityColor,
  getDiagnosisStatusColor,
} from "@/lib/utils/labels";
import { useLocale } from "@/lib/i18n/use-locale";
import { cn } from "@/lib/utils";
import { EvidenceTrail, EngineerReviewBadge } from "@/components/diagnosis/EvidenceTrail";
import type { DiagnosisItem } from "@/types";
import { stripEvidenceTags } from "@/lib/documents/evidence-tags";
import type { SourceEvidence } from "@/types/ai";
import { MapPin, Pencil } from "lucide-react";

interface DiagnosisCardProps {
  item: DiagnosisItem;
  relatedEvidence?: SourceEvidence[];
  documentNames?: Record<string, string>;
  onEdit?: (item: DiagnosisItem) => void;
}

export function DiagnosisCard({ item, relatedEvidence = [], documentNames, onEdit }: DiagnosisCardProps) {
  const { t, label } = useLocale();

  return (
    <Card className="hover:border-copper/20 transition-colors group">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-medium">{item.title}</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {label(diagnosisCategoryLabels, diagnosisCategoryLabelsZh, item.category)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span
              className={cn(
                "inline-flex rounded border px-2 py-0.5 text-[10px] font-medium",
                getSeverityColor(item.severity)
              )}
            >
              {label(severityLabels, severityLabelsZh, item.severity)}
            </span>
            <span
              className={cn(
                "inline-flex rounded px-2 py-0.5 text-[10px] font-medium",
                getDiagnosisStatusColor(item.status)
              )}
            >
              {label(diagnosisStatusLabels, diagnosisStatusLabelsZh, item.status)}
            </span>
            {item.requiresEngineerReview && <EngineerReviewBadge />}
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity mt-1"
                onClick={() => onEdit(item)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <p className="text-xs leading-relaxed text-foreground/80">{item.description}</p>

        {relatedEvidence.length > 0 && (
          <EvidenceTrail evidence={relatedEvidence} documentNames={documentNames} maxItems={3} />
        )}

        {item.evidence && (
          <div className="rounded bg-muted/50 px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
              {t("Evidence", "依据")}
            </p>
            <p className="text-xs">{stripEvidenceTags(item.evidence)}</p>
          </div>
        )}

        {item.recommendation && (
          <div className="border-l-2 border-sage/40 pl-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
              {t("Recommendation", "建议")}
            </p>
            <p className="text-xs">{item.recommendation}</p>
          </div>
        )}

        {item.relatedLocation && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {item.relatedLocation}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
