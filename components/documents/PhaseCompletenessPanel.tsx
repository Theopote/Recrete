"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLocale } from "@/lib/i18n/use-locale";
import {
  computeProjectPhaseCompleteness,
  type PhaseCompletenessResult,
} from "@/lib/documents/phase-completeness";
import {
  documentProjectPhaseLabels,
  documentProjectPhaseLabelsZh,
} from "@/lib/utils/labels";
import type { DocumentAsset, ProjectStatus } from "@/types";
import { CheckCircle2, Circle, Sparkles } from "lucide-react";

interface PhaseCompletenessPanelProps {
  documents: DocumentAsset[];
  projectStatus: ProjectStatus;
}

export function PhaseCompletenessPanel({
  documents,
  projectStatus,
}: PhaseCompletenessPanelProps) {
  const { t, label } = useLocale();
  const report = computeProjectPhaseCompleteness(documents, projectStatus);
  const active = report.phases.find((p) => p.phase === report.activePhase);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium">
            {t("Phase completeness", "阶段资料完备度")}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {t("Active phase", "当前阶段")}:{" "}
            {label(
              documentProjectPhaseLabels,
              documentProjectPhaseLabelsZh,
              report.activePhase
            )}
          </p>
        </div>
        <span className="text-lg font-semibold tabular-nums">{report.overallScore}%</span>
      </div>
      <Progress value={report.overallScore} className="h-2" />

      {active && (
        <PhaseBlock phase={active} bilingual={t} />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {report.phases
          .filter((p) => p.phase !== report.activePhase && p.slots.length > 0)
          .slice(0, 2)
          .map((phase) => (
            <PhaseBlock key={phase.phase} phase={phase} compact bilingual={t} />
          ))}
      </div>
    </div>
  );
}

function PhaseBlock({
  phase,
  compact = false,
  bilingual,
}: {
  phase: PhaseCompletenessResult;
  compact?: boolean;
  bilingual: (en: string, zh: string) => string;
}) {
  const { label } = useLocale();

  return (
    <div className={`rounded-lg border bg-muted/20 ${compact ? "p-3" : "p-4"} space-y-2`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium">
          {label(
            documentProjectPhaseLabels,
            documentProjectPhaseLabelsZh,
            phase.phase
          )}
        </p>
        <Badge variant="outline" className="text-[9px] tabular-nums">
          {phase.score}%
        </Badge>
      </div>
      <ul className="space-y-1.5">
        {phase.slots.map((slot) => (
          <li key={slot.id} className="flex items-start gap-2 text-xs">
            {slot.satisfied ? (
              <CheckCircle2
                className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${
                  slot.analyzed ? "text-sage" : "text-muted-foreground"
                }`}
              />
            ) : (
              <Circle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground/50" />
            )}
            <div className="min-w-0 flex-1">
              <span>{bilingual(slot.label, slot.labelZh)}</span>
              {slot.satisfied && slot.analyzed && (
                <Sparkles className="inline h-3 w-3 ml-1 text-copper" />
              )}
            </div>
          </li>
        ))}
      </ul>
      {phase.missingLabels.length > 0 && !compact && (
        <p className="text-[10px] text-muted-foreground">
          {bilingual("Missing", "缺失")}:{" "}
          {phase.missingLabels.map((en, i) => bilingual(en, phase.missingLabelsZh[i] ?? en)).join(", ")}
        </p>
      )}
    </div>
  );
}
