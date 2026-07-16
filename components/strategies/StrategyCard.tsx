import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RiskBadge } from "@/components/app/RiskBadge";
import { StrategyRefineDialog } from "@/components/strategies/StrategyRefineDialog";
import { StrategyReviewThread } from "@/components/strategies/StrategyReviewThread";
import { StrategyVersionHistory } from "@/components/strategies/StrategyVersionHistory";
import { StrategyLinkedSources } from "@/components/strategies/StrategyLinkedSources";
import { strategyTypeLabels } from "@/lib/utils/labels";
import { cn, levelToPercent } from "@/lib/utils";
import type { DiagnosisItem, RenovationStrategy, StrategyWithMetrics } from "@/types";
import type { SourceEvidence } from "@/types/ai";
import { Check, X, Star } from "lucide-react";

interface StrategyCardProps {
  strategy: StrategyWithMetrics | (RenovationStrategy & { rank?: number; compositeScore?: number; metrics?: StrategyWithMetrics["metrics"] });
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
                  {strategy.compositeScore != null && ` · ${strategy.compositeScore}分`}
                </Badge>
              )}
              {isRecommended && (
                <Badge className="bg-copper text-copper-foreground text-[10px] gap-1">
                  <Star className="h-3 w-3" /> Recommended
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {strategyTypeLabels[strategy.type]}
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
          <StrategyField label="Design Goal" value={strategy.designGoal} />
          <StrategyField label="Spatial" value={strategy.spatialStrategy} />
          <StrategyField label="Structural" value={strategy.structuralStrategy} />
          <StrategyField label="Facade" value={strategy.facadeStrategy} />
          <StrategyField label="MEP" value={strategy.mepStrategy} className="col-span-2" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <LevelBar label="Cost" level={strategy.costLevel} />
          <LevelBar label="Schedule" level={strategy.scheduleLevel} />
          <LevelBar label="Risk" level={strategy.riskLevel} />
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="font-medium text-sage mb-1.5 flex items-center gap-1">
              <Check className="h-3 w-3" /> Pros
            </p>
            <ul className="space-y-1 text-muted-foreground">
              {strategy.pros.map((p) => (
                <li key={p} className="flex items-start gap-1.5">
                  <span className="text-sage mt-1">•</span>{p}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-medium text-destructive mb-1.5 flex items-center gap-1">
              <X className="h-3 w-3" /> Cons
            </p>
            <ul className="space-y-1 text-muted-foreground">
              {strategy.cons.map((c) => (
                <li key={c} className="flex items-start gap-1.5">
                  <span className="text-destructive mt-1">•</span>{c}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {strategy.recommendationReason && (
          <div className="rounded-md bg-copper/5 border border-copper/20 p-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-copper mb-1">
              Why Recommended
            </p>
            <p className="text-xs">{strategy.recommendationReason}</p>
          </div>
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

function StrategyField({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
      <p className="text-xs leading-relaxed">{value}</p>
    </div>
  );
}

function LevelBar({ label, level }: { label: string; level: string }) {
  const percent = levelToPercent(level);
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="capitalize font-medium">{level}</span>
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
