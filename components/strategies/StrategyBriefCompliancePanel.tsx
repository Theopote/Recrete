"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLocale } from "@/lib/i18n/use-locale";
import { CheckCircle2, Circle, FileText } from "lucide-react";
import type { BriefComplianceResult } from "@/lib/ai/brief-compliance-scoring";

interface StrategyBriefCompliancePanelProps {
  result: BriefComplianceResult;
}

export function StrategyBriefCompliancePanel({ result }: StrategyBriefCompliancePanelProps) {
  const { t } = useLocale();

  if (result.total === 0) return null;

  return (
    <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 text-copper" />
          <p className="text-[10px] font-medium">
            {t("Brief Constraint Coverage", "任务书约束覆盖率")}
          </p>
        </div>
        <Badge
          variant={result.score >= 80 ? "default" : result.score >= 50 ? "outline" : "destructive"}
          className="text-[9px]"
        >
          {result.satisfied}/{result.total} · {result.score}%
        </Badge>
      </div>
      <Progress value={result.score} className="h-1.5" />
      <ul className="space-y-1">
        {result.checks.map((check) => (
          <li key={check.factId} className="flex items-start gap-1.5 text-[10px]">
            {check.satisfied ? (
              <CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5 text-sage" />
            ) : (
              <Circle className="h-3 w-3 shrink-0 mt-0.5 text-muted-foreground/50" />
            )}
            <span className={check.satisfied ? "" : "text-muted-foreground"}>
              {check.label}: {check.value.slice(0, 60)}
            </span>
          </li>
        ))}
      </ul>
      {result.gaps.length > 0 && (
        <p className="text-[9px] text-muted-foreground">
          {t("Gaps", "缺口")}: {result.gaps.slice(0, 3).join("; ")}
        </p>
      )}
    </div>
  );
}
