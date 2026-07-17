"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/use-locale";
import { Stethoscope } from "lucide-react";

interface IngestDiagnosisPromptCardProps {
  projectId: string;
  evidenceCount: number;
  onDismiss?: () => void;
}

export function IngestDiagnosisPromptCard({
  projectId,
  evidenceCount,
  onDismiss,
}: IngestDiagnosisPromptCardProps) {
  const router = useRouter();
  const { t } = useLocale();

  return (
    <Card className="border-copper/30 bg-copper/5">
      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-2">
          <Stethoscope className="h-4 w-4 text-copper shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium">
              {t("New document evidence ready for diagnosis", "新文档证据可用于诊断")}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {t(
                `${evidenceCount} evidence item(s) extracted — refresh diagnosis to link findings.`,
                `已抽取 ${evidenceCount} 条证据 — 建议更新诊断以关联发现。`
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              {t("Dismiss", "关闭")}
            </Button>
          )}
          <Button
            variant="copper"
            size="sm"
            onClick={() => router.push(`/projects/${projectId}?section=diagnosis`)}
          >
            {t("Open Diagnosis", "打开诊断")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
