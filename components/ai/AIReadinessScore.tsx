"use client";

import { ScoreRing } from "@/components/app/ScoreRing";
import { useLocale } from "@/lib/i18n/use-locale";

interface AIReadinessScoreProps {
  score: number;
  size?: number;
}

export function AIReadinessScore({ score, size = 64 }: AIReadinessScoreProps) {
  const { t } = useLocale();
  return <ScoreRing score={score} label={t("AI Ready", "AI 就绪")} size={size} />;
}
