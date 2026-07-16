"use client";

import { EvidenceTrail } from "@/components/diagnosis/EvidenceTrail";
import {
  diagnosisCategoryLabels,
  diagnosisCategoryLabelsZh,
  severityLabels,
  severityLabelsZh,
} from "@/lib/utils/labels";
import { useLocale } from "@/lib/i18n/use-locale";
import type { DiagnosisItem } from "@/types";
import type { SourceEvidence } from "@/types/ai";
import { Link2 } from "lucide-react";

interface StrategyLinkedSourcesProps {
  linkedDiagnosisIds?: string[];
  linkedEvidenceIds?: string[];
  diagnosis: DiagnosisItem[];
  evidence: SourceEvidence[];
  documentNames?: Record<string, string>;
}

export function StrategyLinkedSources({
  linkedDiagnosisIds = [],
  linkedEvidenceIds = [],
  diagnosis,
  evidence,
  documentNames = {},
}: StrategyLinkedSourcesProps) {
  const { t, label } = useLocale();
  const linkedDiagnosis = diagnosis.filter((d) => linkedDiagnosisIds.includes(d.id));
  const linkedEvidence = evidence.filter((e) => linkedEvidenceIds.includes(e.id));

  if (linkedDiagnosis.length === 0 && linkedEvidence.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md border bg-muted/20 p-3 space-y-3">
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        <Link2 className="h-3 w-3" />
        {t("Strategy evidence chain", "方案依据链")}
      </div>

      {linkedDiagnosis.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-muted-foreground">
            {t(`Linked diagnosis (${linkedDiagnosis.length})`, `关联诊断 (${linkedDiagnosis.length})`)}
          </p>
          <ul className="space-y-1">
            {linkedDiagnosis.map((item) => (
              <li key={item.id} className="text-xs rounded bg-background/80 px-2 py-1.5">
                <span className="font-medium">{item.title}</span>
                <span className="text-muted-foreground">
                  {" "}
                  · {label(diagnosisCategoryLabels, diagnosisCategoryLabelsZh, item.category)} ·{" "}
                  {label(severityLabels, severityLabelsZh, item.severity)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {linkedEvidence.length > 0 && (
        <EvidenceTrail
          evidence={linkedEvidence}
          documentNames={documentNames}
          maxItems={4}
        />
      )}
    </div>
  );
}
