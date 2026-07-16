"use client";

import { Progress } from "@/components/ui/progress";
import { useLocale } from "@/lib/i18n/use-locale";

interface DataCompletenessScoreProps {
  score: number;
}

export function DataCompletenessScore({ score }: DataCompletenessScoreProps) {
  const { t } = useLocale();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-muted-foreground">
          {t("Data Completeness", "数据完整度")}
        </span>
        <span className="font-mono font-semibold">{score}%</span>
      </div>
      <Progress value={score} className="h-2" />
    </div>
  );
}
