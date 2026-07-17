"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RiskBadge } from "@/components/app/RiskBadge";
import { StrategyRefineDialog } from "@/components/strategies/StrategyRefineDialog";
import { StrategyReviewThread } from "@/components/strategies/StrategyReviewThread";
import { StrategyVersionHistory } from "@/components/strategies/StrategyVersionHistory";
import { StrategyLinkedSources } from "@/components/strategies/StrategyLinkedSources";
import { StrategyBriefCompliancePanel } from "@/components/strategies/StrategyBriefCompliancePanel";
import { StrategyScoreBreakdown } from "@/components/strategies/StrategyScoreBreakdown";
import { StrategyTierProfilePanel } from "@/components/strategies/StrategyTierProfilePanel";
import { strategyTypeLabels, strategyTypeLabelsZh, riskLevelLabels, riskLevelLabelsZh } from "@/lib/utils/labels";
import { useLocale } from "@/lib/i18n/use-locale";
import { cn, levelToPercent } from "@/lib/utils";
import type { DiagnosisItem, RenovationStrategy, RiskLevel, StrategyWithMetrics } from "@/types";
import type { SourceEvidence } from "@/types/ai";
import { Check, X, Star } from "lucide-react";

interface StrategyCardProps {
  strategy: StrategyWithMetrics | (RenovationStrategy & {
    rank?: number;
    compositeScore?: number;
    metrics?: StrategyWithMetrics["metrics"];
    scoreContributions?: StrategyWithMetrics["scoreContributions"];
    scoreWeights?: StrategyWithMetrics["scoreWeights"];
    tierProfile?: StrategyWithMetrics["tierProfile"];
    lifecycleBonus?: number;
    briefComplianceResult?: StrategyWithMetrics["briefComplianceResult"];
  });
  isRecommended?: boolean;
  projectId?: string;
  riskOptions?: string[];
  diagnosis?: DiagnosisItem[];
  evidence?: SourceEvidence[];
  documentNames?: Record<string, string>;
  onRefined?: (strategy: StrategyWithMetrics) => void;
}

export function StrategyCard({
  strategy,
  isRecommended,
  projectId,
  riskOptions,
  diagnosis = [],
  evidence = [],
  documentNames = {},
  onRefined,
}: StrategyCardProps) {
  const { t, label } = useLocale();

  return (
    <Card className={cn(isRecommended && "border-copper ring-1 ring-copper/20")}>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-semibold">{strategy.name}</h4>
              {strategy.rank != null && strategy.rank <= 3 && (
                <Badge variant="outline" className="text-[10px]">
                  #{strategy.rank}
                  {strategy.compositeScore != null &&
                    ` · ${strategy.compositeScore}${t(" pts", "分")}`}
                </Badge>
              )}
              {isRecommended && (
                <Badge className="bg-copper text-copper-foreground text-[10px] gap-1">
                  <Star className="h-3 w-3" /> {t("Recommended", "推荐")}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {label(strategyTypeLabels, strategyTypeLabelsZh, strategy.type)}
            </p>
            {projectId && onRefined && (
              <StrategyRefineDialog
                projectId={projectId}
                strategy={strategy as StrategyWithMetrics}
                onRefined={onRefined}
              />
            )}
          </div>
          <RiskBadge level={strategy.riskLevel} />
        </div>

        <p className="text-xs leading-relaxed">{strategy.summary}</p>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <StrategyField label={t("Design Goal", "设计目标")} value={strategy.designGoal} />
          <StrategyField label={t("Spatial", "空间策略")} value={strategy.spatialStrategy} />
          <StrategyField label={t("Structural", "结构策略")} value={strategy.structuralStrategy} />
          <StrategyField label={t("Facade", "立面策略")} value={strategy.facadeStrategy} />
          <StrategyField label={t("MEP", "机电策略")} value={strategy.mepStrategy} className="col-span-2" />
        </div>

        {strategy.tierProfile && (
          <StrategyTierProfilePanel profile={strategy.tierProfile} />
        )}

        <div className="grid grid-cols-3 gap-3">
          <LevelBar label={t("Cost", "成本")} level={strategy.costLevel} />
          <LevelBar label={t("Schedule", "工期")} level={strategy.scheduleLevel} />
          <LevelBar label={t("Risk", "风险")} level={strategy.riskLevel} />
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="font-medium text-sage mb-1.5 flex items-center gap-1">
              <Check className="h-3 w-3" /> {t("Pros", "优势")}
            </p>
            <ul className="space-y-1 text-muted-foreground">
              {strategy.pros.map((p) => (
                <li key={p} className="flex items-start gap-1.5">
                  <span className="text-sage mt-1">•</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-medium text-destructive mb-1.5 flex items-center gap-1">
              <X className="h-3 w-3" /> {t("Cons", "劣势")}
            </p>
            <ul className="space-y-1 text-muted-foreground">
              {strategy.cons.map((c) => (
                <li key={c} className="flex items-start gap-1.5">
                  <span className="text-destructive mt-1">•</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {strategy.recommendationReason && (
          <div className="rounded-md bg-copper/5 border border-copper/20 p-3 space-y-2">
            <p className="text-[10px] font-medium uppercase tracking-wider text-copper mb-1">
              {t("Why Recommended", "推荐理由")}
            </p>
            <p className="text-xs">{strategy.recommendationReason}</p>
            {strategy.scoreContributions && strategy.scoreContributions.length > 0 && (
              <StrategyScoreBreakdown
                contributions={strategy.scoreContributions}
                compositeScore={strategy.compositeScore}
                lifecycleBonus={strategy.lifecycleBonus}
                compact
              />
            )}
          </div>
        )}

        {strategy.briefComplianceResult && (
          <StrategyBriefCompliancePanel result={strategy.briefComplianceResult} />
        )}

        <StrategyLinkedSources
          linkedDiagnosisIds={strategy.linkedDiagnosisIds}
          linkedEvidenceIds={strategy.linkedEvidenceIds}
          diagnosis={diagnosis}
          evidence={evidence}
          documentNames={documentNames}
        />

        {projectId && (
          <StrategyReviewThread
            projectId={projectId}
            strategyId={strategy.id}
            riskOptions={riskOptions}
          />
        )}

        {projectId && (
          <StrategyVersionHistory projectId={projectId} strategyId={strategy.id} />
        )}
      </CardContent>
    </Card>
  );
}

function StrategyField({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">
        {label}
      </p>
      <p className="text-xs leading-relaxed">{value}</p>
    </div>
  );
}

function LevelBar({ label, level }: { label: string; level: string }) {
  const { label: labelFn } = useLocale();
  const percent = levelToPercent(level);
  const levelText =
    labelFn(riskLevelLabels, riskLevelLabelsZh, level as RiskLevel) ?? level;

  return (
    <div>
      <div className="flex justify-between text-[10px] mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{levelText}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-copper rounded-full transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
