"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DocumentsSection } from "./DocumentsSection";
import { SectionHeader } from "@/components/app/SectionHeader";
import { DataCompletenessScore } from "@/components/ai/DataCompletenessScore";
import { MissingInformationList } from "@/components/ai/MissingInformationList";
import { RecommendedActions } from "@/components/ai/RecommendedActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { pollAnalysisTasks } from "@/lib/documents/poll-analysis-task";
import type { ProjectWithRelations } from "@/types";
import { Sparkles, Loader2, FileSearch } from "lucide-react";
import { ConfidenceBadge } from "@/components/ai/ConfidenceBadge";
import { useLocale } from "@/lib/i18n/use-locale";

interface SurveyIntelligenceSectionProps {
  project: ProjectWithRelations;
}

export function SurveyIntelligenceSection({ project }: SurveyIntelligenceSectionProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [analyzing, setAnalyzing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const documents = project.documents ?? [];

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setNotice(null);
    try {
      const queueRes = await fetch(`/api/projects/${project.id}/survey/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ async: true }),
      });
      const queued = await queueRes.json();

      if (!queueRes.ok) {
        setNotice(queued.message ?? t("Failed to queue analysis", "分析排队失败"));
        return;
      }

      if (queued.taskIds?.length > 0) {
        setNotice(queued.message ?? t(`Queued ${queued.taskIds.length} tasks`, `已排队 ${queued.taskIds.length} 个任务`));
        const poll = await pollAnalysisTasks(project.id, queued.taskIds, setNotice);
        setNotice(
          t(
            `Document analysis: ${poll.completed} succeeded, ${poll.failed} failed, ${poll.timeout} timed out`,
            `文档分析完成：${poll.completed} 成功，${poll.failed} 失败，${poll.timeout} 超时`
          )
        );

        const finalizeRes = await fetch(`/api/projects/${project.id}/survey/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ finalize: true }),
        });
        if (!finalizeRes.ok) {
          setNotice(
            t(
              "Documents analyzed, but missing-info detection failed. Please retry.",
              "文档已分析，但缺失信息检测失败，请重试。"
            )
          );
        }
      } else {
        setNotice(queued.message ?? t("No documents pending analysis", "没有待分析的文档"));
        await fetch(`/api/projects/${project.id}/survey/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ finalize: true }),
        });
      }

      router.refresh();
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Survey Intelligence"
        titleZh="勘察智能"
        description="AI-powered document analysis, missing information detection, and survey task recommendations"
        descriptionZh="AI 文档分析、缺失信息检测与勘察任务建议"
        action={
          <Button variant="copper" size="sm" onClick={handleAnalyze} disabled={analyzing}>
            {analyzing ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            )}
            {t("Analyze Documents", "分析文档")}
          </Button>
        }
      />

      {notice && (
        <p className="text-xs text-muted-foreground">{notice}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <DataCompletenessScore score={project.dataCompletenessScore} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">
              {t("Documents on file", "已归档文档")}
            </p>
            <p className="text-2xl font-semibold tabular-nums">{documents.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">
              {t("AI-analyzed", "AI 已分析")}
            </p>
            <p className="text-2xl font-semibold tabular-nums">
              {documents.filter((d) => d.aiSummary).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {documents.some((d) => d.aiSummary) && (
        <div>
          <SectionHeader
            title="AI Document Summaries"
            titleZh="AI 文档摘要"
            icon={FileSearch}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {documents
              .filter((d) => d.aiSummary)
              .map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <ConfidenceBadge confidence={0.85} />
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-4">{doc.aiSummary}</p>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      <MissingInformationList items={[]} fromMemory={project.buildingMemory} />
      <RecommendedActions tasks={project.tasks ?? []} projectId={project.id} />
      <DocumentsSection project={project} />
    </div>
  );
}
