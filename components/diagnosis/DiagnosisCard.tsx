"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  diagnosisCategoryLabels,
  diagnosisStatusLabels,
  severityLabels,
  getSeverityColor,
  getDiagnosisStatusColor,
} from "@/lib/utils/labels";
import { cn } from "@/lib/utils";
import type { DiagnosisItem } from "@/types";
import { MapPin, Pencil } from "lucide-react";

interface DiagnosisCardProps {
  item: DiagnosisItem;
  onEdit?: (item: DiagnosisItem) => void;
}

export function DiagnosisCard({ item, onEdit }: DiagnosisCardProps) {
  return (
    <Card className="hover:border-copper/20 transition-colors group">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-medium">{item.title}</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {diagnosisCategoryLabels[item.category]}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={cn("inline-flex rounded border px-2 py-0.5 text-[10px] font-medium", getSeverityColor(item.severity))}>
              {severityLabels[item.severity]}
            </span>
            <span className={cn("inline-flex rounded px-2 py-0.5 text-[10px] font-medium", getDiagnosisStatusColor(item.status))}>
              {diagnosisStatusLabels[item.status]}
            </span>
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

        {item.evidence && (
          <div className="rounded bg-muted/50 px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Evidence</p>
            <p className="text-xs">{item.evidence}</p>
          </div>
        )}

        {item.recommendation && (
          <div className="border-l-2 border-sage/40 pl-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Recommendation</p>
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
