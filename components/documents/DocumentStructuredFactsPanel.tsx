"use client";

import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/i18n/use-locale";
import { parseStoredDocumentExtract } from "@/lib/documents/structured-extract-storage";
import type { DocumentAsset } from "@/types";
import type { DocumentStructuredExtract } from "@/types/document-facts";
import { Scale, FileText } from "lucide-react";

interface DocumentStructuredFactsPanelProps {
  document: DocumentAsset;
}

function resolveExtract(document: DocumentAsset): DocumentStructuredExtract | null {
  const fromStored = parseStoredDocumentExtract(document.extractedText)?.structured;
  if (fromStored) return fromStored;
  return null;
}

export function DocumentStructuredFactsPanel({ document }: DocumentStructuredFactsPanelProps) {
  const { t } = useLocale();
  const extract = resolveExtract(document);

  if (!extract || extract.facts.length === 0) return null;

  const isReg = extract.kind === "regulations";

  return (
    <div className="rounded-lg border border-copper/25 bg-copper/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        {isReg ? (
          <Scale className="h-4 w-4 text-copper" />
        ) : (
          <FileText className="h-4 w-4 text-copper" />
        )}
        <h4 className="text-sm font-medium">
          {isReg
            ? t("Structured regulation extract", "法规结构化抽取")
            : t("Structured brief extract", "任务书结构化抽取")}
        </h4>
        <Badge variant="outline" className="text-[9px] ml-auto">
          {extract.facts.length} {t("facts", "条")}
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground">{extract.summary}</p>

      <ul className="space-y-2 max-h-48 overflow-y-auto">
        {isReg
          ? extract.facts.map((fact) => (
              <li key={fact.id} className="text-xs rounded border bg-background/80 p-2 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{fact.codeRef}</span>
                  {fact.section && (
                    <span className="text-muted-foreground">{fact.section}</span>
                  )}
                  <Badge variant="secondary" className="text-[9px]">
                    {fact.priority}
                  </Badge>
                </div>
                <p>{fact.requirement}</p>
                {fact.remediationHint && (
                  <p className="text-muted-foreground">{fact.remediationHint}</p>
                )}
              </li>
            ))
          : extract.facts.map((fact) => (
              <li key={fact.id} className="text-xs rounded border bg-background/80 p-2">
                <span className="font-medium">{fact.label}: </span>
                <span>{fact.value}</span>
              </li>
            ))}
      </ul>
    </div>
  );
}
