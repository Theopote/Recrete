"use client";

import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { cn } from "@/lib/utils";
import type { ElevatorFeasibilityResult } from "@/types/elevator-feasibility";

interface ElevatorFeasibilityPanelProps {
  result: ElevatorFeasibilityResult;
}

const VERDICT_CONFIG = {
  feasible: {
    labelEn: "Feasible",
    labelZh: "可行",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  conditional: {
    labelEn: "Conditionally Feasible",
    labelZh: "条件可行",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  infeasible: {
    labelEn: "Infeasible",
    labelZh: "不可行",
    className: "bg-red-100 text-red-800 border-red-200",
  },
  insufficient_data: {
    labelEn: "Insufficient Data",
    labelZh: "数据不足",
    className: "bg-muted text-muted-foreground border-border",
  },
} as const;

function statusIcon(status: string) {
  if (status === "compliant" || status === "true") return "✅";
  if (status === "non_compliant" || status === "false") return "❌";
  return "⚠️";
}

function CheckRow({
  icon,
  title,
  note,
}: {
  icon: string;
  title: string;
  note: string;
}) {
  return (
    <div className="rounded-md border bg-background/60 p-2.5 space-y-0.5">
      <p className="text-[11px] font-medium">
        {icon} {title}
      </p>
      <p className="text-[10px] text-muted-foreground leading-relaxed">{note}</p>
    </div>
  );
}

export function ElevatorFeasibilityPanel({ result }: ElevatorFeasibilityPanelProps) {
  const { t } = useLocale();
  const config = VERDICT_CONFIG[result.verdict];

  const structuralIcon =
    result.structuralCheck.compliant === true
      ? "✅"
      : result.structuralCheck.compliant === false
        ? "❌"
        : "⚠️";

  return (
    <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold">
          {t("Elevator Addition Feasibility", "电梯加装可行性")}
        </p>
        <Badge variant="outline" className={cn("text-[10px]", config.className)}>
          {t(config.labelEn, config.labelZh)}
        </Badge>
      </div>

      <div className="space-y-2">
        <CheckRow
          icon={result.spaceCheck.meetsMinimum ? "✅" : "❌"}
          title={t("Candidate Space", "候选空间")}
          note={result.spaceCheck.note}
        />
        <CheckRow
          icon={structuralIcon}
          title={t("Structural Load", "结构荷载")}
          note={result.structuralCheck.note}
        />
        {result.complianceChecks.map((check) => (
          <CheckRow
            key={check.ruleId}
            icon={statusIcon(check.status)}
            title={check.ruleId}
            note={check.note}
          />
        ))}
        {result.heritageFlag && (
          <CheckRow
            icon="⚠️"
            title={t("Heritage Review", "文保审批")}
            note={result.heritageFlag.note}
          />
        )}
      </div>

      {result.aiRecommendation && (
        <div className="rounded-md border border-dashed border-copper/30 bg-copper/5 p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-copper">
            <Sparkles className="h-3 w-3" />
            {t(
              "AI design recommendation (based on verified constraints above)",
              "以下为 AI 基于左侧已验证条件给出的设计建议"
            )}
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {result.aiRecommendation}
          </p>
        </div>
      )}
    </div>
  );
}
