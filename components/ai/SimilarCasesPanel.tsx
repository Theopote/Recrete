"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/app/SectionHeader";
import { useLocale } from "@/lib/i18n/use-locale";
import { cn } from "@/lib/utils";
import { AlertTriangle, BookOpen, CheckCircle2, Loader2 } from "lucide-react";
import type { SimilarCaseResult, CaseFailureWarning } from "@/lib/ai/knowledge/similar-cases";

interface SimilarCasesPanelProps {
  projectId: string;
  compact?: boolean;
}

const outcomeStyles: Record<string, { labelEn: string; labelZh: string; className: string }> = {
  success: {
    labelEn: "Success",
    labelZh: "成功",
    className: "bg-sage/15 text-sage border-sage/30",
  },
  partial: {
    labelEn: "Partial",
    labelZh: "部分成功",
    className: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  },
  failure: {
    labelEn: "Failure",
    labelZh: "失败警示",
    className: "bg-red-500/15 text-red-700 border-red-500/30",
  },
};

function CaseCard({ c, compact }: { c: SimilarCaseResult; compact?: boolean }) {
  const { t } = useLocale();
  const style = outcomeStyles[c.outcome] ?? outcomeStyles.success;
  const outcomeLabel = t(style.labelEn, style.labelZh);

  return (
    <Card className={cn("border", c.outcome === "failure" && "border-red-200/60")}>
      <CardContent className={cn("p-4", compact && "p-3")}>
        <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className={cn("text-[10px]", style.className)}>
                {c.outcome === "failure" ? (
                  <AlertTriangle className="mr-1 h-3 w-3" />
                ) : c.outcome === "success" ? (
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                ) : null}
                {outcomeLabel}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {Math.round(c.relevance * 100)}% {t("match", "匹配")}
              </span>
            </div>
            <h4 className="text-sm font-semibold leading-tight">{c.title}</h4>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {c.location} · {c.region} · {c.strategyType.replace(/_/g, " ")}
              {c.costPerSqm ? ` · ~¥${c.costPerSqm.toLocaleString()}/m²` : ""}
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">{c.summary}</p>

        {c.matchReasons.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {c.matchReasons.map((r) => (
              <span
                key={r}
                className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
              >
                {r}
              </span>
            ))}
          </div>
        )}

        {c.lessons.length > 0 && (
          <ul className="mt-2 space-y-0.5 text-[11px] text-muted-foreground">
            {c.lessons.slice(0, compact ? 2 : 3).map((lesson) => (
              <li key={lesson} className="flex gap-1.5">
                <span className="text-copper shrink-0">•</span>
                <span>{lesson}</span>
              </li>
            ))}
          </ul>
        )}

        {c.failureReasons && c.failureReasons.length > 0 && (
          <ul className="mt-2 space-y-0.5 text-[11px] text-red-700/90">
            {c.failureReasons.slice(0, 2).map((reason) => (
              <li key={reason} className="flex gap-1.5">
                <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function WarningBanner({ w }: { w: CaseFailureWarning }) {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50/50 px-3 py-2 text-xs">
      <p className="font-medium text-amber-900">{w.title}</p>
      <p className="text-amber-800/90 mt-0.5">{w.summary}</p>
    </div>
  );
}

export function SimilarCasesPanel({ projectId, compact }: SimilarCasesPanelProps) {
  const { t } = useLocale();
  const [loading, setLoading] = useState(true);
  const [successCases, setSuccessCases] = useState<SimilarCaseResult[]>([]);
  const [warningCases, setWarningCases] = useState<SimilarCaseResult[]>([]);
  const [failureWarnings, setFailureWarnings] = useState<CaseFailureWarning[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/projects/${projectId}/similar-cases?limit=${compact ? 3 : 5}`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setSuccessCases(data.successCases ?? []);
        setWarningCases(data.warningCases ?? []);
        setFailureWarnings(data.failureWarnings ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, compact]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t("Loading similar projects…", "加载相似项目…")}
      </div>
    );
  }

  if (successCases.length === 0 && warningCases.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {!compact && (
        <SectionHeader
          title="Similar Projects"
          titleZh="相似项目案例"
          description="AI-retrieved renovation precedents with success references and failure warnings"
          descriptionZh="AI 检索相似改造先例，提供成功案例参考与失败教训警示"
        />
      )}

      {failureWarnings.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-medium uppercase tracking-wider text-amber-700">
            {t("Failure Warnings", "失败案例警示")}
          </p>
          {failureWarnings.slice(0, compact ? 2 : 4).map((w, i) => (
            <WarningBanner key={`${w.caseId}-${i}`} w={w} />
          ))}
        </div>
      )}

      {successCases.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <BookOpen className="h-3 w-3" />
            {t("Success References", "成功案例")}
          </p>
          <div className={cn("grid gap-3", compact ? "grid-cols-1" : "md:grid-cols-2")}>
            {successCases.slice(0, compact ? 2 : 4).map((c) => (
              <CaseCard key={c.id} c={c} compact={compact} />
            ))}
          </div>
        </div>
      )}

      {warningCases.length > 0 && !compact && (
        <div className="space-y-2">
          <p className="text-[10px] font-medium uppercase tracking-wider text-red-700 flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3" />
            {t("Cautionary Cases", "警示案例")}
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {warningCases.map((c) => (
              <CaseCard key={c.id} c={c} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
