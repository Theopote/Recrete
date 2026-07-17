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
import { navigateToBuildingCondition } from "@/lib/building-condition/client-navigation";
import { shouldOpenBuildingCondition } from "@/lib/building-condition/cad-file-utils";
import type { ProjectWithRelations } from "@/types";
import { Sparkles, Loader2, FileSearch, Building2 } from "lucide-react";
import { PhaseCompletenessPanel } from "@/components/documents/PhaseCompletenessPanel";
import { computeProjectPhaseCompleteness } from "@/lib/documents/phase-completeness";
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
  const phaseReport = computeProjectPhaseCompleteness(documents, project.status);

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
        } else if (poll.completed > 0) {
          setNotice(
            t(
              "Document evidence updated — consider refreshing diagnosis.",
              "文档证据已更新 — 建议刷新诊断。"
            )
          );
        }

        if (
          poll.completed > 0 &&
          documents.some((d) => shouldOpenBuildingCondition(d.name, d.category))
        ) {
          setNotice(t("Opening Building Condition…", "正在打开建筑现状…"));
          navigateToBuildingCondition(project.id);
          return;
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

      {documents.some((d) => d.aiSummary) && (
        <Card className="border-copper/20 bg-copper/5">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-2">
              <Building2 className="h-4 w-4 text-copper shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium">
                  {t("Drawings digitized for Building Condition", "图纸已数字化至建筑现状")}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {t(
                    "View AI-extracted rooms, structure, and annotations on plan overlays.",
                    "在建筑现状视图中查看 AI 抽取的空间、结构与标注叠加层。"
                  )}
                </p>
              </div>
            </div>
            <a
              href={`/projects/${project.id}?section=building-condition`}
              className="inline-flex items-center justify-center rounded-md border border-copper/40 bg-background px-3 py-1.5 text-xs font-medium text-copper hover:bg-copper/10 transition-colors no-underline shrink-0"
            >
              {t("Open Building Condition", "打开建筑现状")}
            </a>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <DataCompletenessScore score={phaseReport.overallScore} />
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardContent className="p-4">
            <PhaseCompletenessPanel documents={documents} projectStatus={project.status} />
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
