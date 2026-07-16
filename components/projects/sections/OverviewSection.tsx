"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BuildingProfileCard } from "@/components/app/BuildingProfileCard";
import { IssueCard } from "@/components/issues/IssueCard";
import { SectionHeader } from "@/components/app/SectionHeader";
import { Card, CardContent } from "@/components/ui/card";
import { AIInsightList } from "@/components/ai/AIInsightList";
import { AIReadinessScore } from "@/components/ai/AIReadinessScore";
import { DataCompletenessScore } from "@/components/ai/DataCompletenessScore";
import { RecommendedActions } from "@/components/ai/RecommendedActions";
import { MissingInformationList } from "@/components/ai/MissingInformationList";
import { AnalysisRunTimeline } from "@/components/ai/AnalysisRunTimeline";
import { BuildingMemoryCard } from "@/components/ai/BuildingMemoryCard";
import { SimilarCasesPanel } from "@/components/ai/SimilarCasesPanel";
import type { ProjectWithRelations } from "@/types";
import type { AIInsight } from "@/types/ai";
import { COST_RISK_INSIGHT_SOURCE } from "@/types/ai";
import { Brain } from "lucide-react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/use-locale";

interface OverviewSectionProps {
  project: ProjectWithRelations;
}

function parseInsight(insight: AIInsight): AIInsight {
  return {
    ...insight,
    createdAt: new Date(insight.createdAt),
    updatedAt: new Date(insight.updatedAt),
  };
}

function buildOverviewInsightPanels(insights: AIInsight[]) {
  const costRiskInsights = insights.filter((i) => i.sourceType === COST_RISK_INSIGHT_SOURCE);
  const priorityOther = insights.filter(
    (i) =>
      i.sourceType !== COST_RISK_INSIGHT_SOURCE &&
      (i.priority === "high" || i.priority === "critical")
  );

  const seen = new Set<string>();
  const merged: AIInsight[] = [];
  for (const item of [...costRiskInsights, ...priorityOther]) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(item);
  }

  return {
    costRiskInsights,
    displayInsights: merged.slice(0, 6),
  };
}

export function OverviewSection({ project }: OverviewSectionProps) {
  const { t } = useLocale();
  const [insights, setInsights] = useState<AIInsight[]>(() =>
    (project.insights ?? []).map(parseInsight)
  );

  const refreshInsights = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${project.id}`);
      if (!res.ok) return;
      const data = (await res.json()) as ProjectWithRelations;
      if (Array.isArray(data.insights)) {
        setInsights(data.insights.map(parseInsight));
      }
    } catch {
      // keep existing insights on fetch failure
    }
  }, [project.id]);

  useEffect(() => {
    refreshInsights();
  }, [refreshInsights]);

  useEffect(() => {
    const onFocus = () => refreshInsights();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshInsights]);

  const { costRiskInsights, displayInsights } = useMemo(
    () => buildOverviewInsightPanels(insights),
    [insights]
  );

  const openIssues =
    project.issues?.filter((i) => i.status === "open" || i.status === "in_progress") ?? [];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Project Command Overview"
        titleZh="项目指挥概览"
        description={`AI-enriched workspace for ${project.name}`}
        descriptionZh={`${project.name} 的 AI 增强工作区`}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex justify-center p-4">
            <AIReadinessScore score={project.aiReadinessScore} />
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardContent className="p-4">
            <DataCompletenessScore score={project.dataCompletenessScore} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-xs space-y-1">
            <p className="text-muted-foreground">{t("AI Insights", "AI 洞察")}</p>
            <p className="text-2xl font-semibold">{insights.length}</p>
            {costRiskInsights.length > 0 && (
              <p className="text-[10px] text-sage">
                {costRiskInsights.length} {t("from Cost & Risk / ROI", "来自成本与风险 / ROI")}
              </p>
            )}
            <p className="text-muted-foreground pt-1">{t("Analysis Runs", "分析记录")}</p>
            <p className="text-lg font-semibold">{project.analysisRuns?.length ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {project.buildingMemory && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-copper" />
              <h3 className="text-sm font-semibold">
                {t("Building Memory Snapshot", "建筑记忆快照")}
              </h3>
            </div>
            <Link
              href={`/projects/${project.id}?section=building-memory`}
              className="text-[10px] font-medium text-copper hover:underline"
            >
              {t("View full memory →", "查看完整记忆 →")}
            </Link>
          </div>
          <BuildingMemoryCard memory={project.buildingMemory} />
        </div>
      )}

      <BuildingProfileCard project={project} building={project.building} />

      <SimilarCasesPanel projectId={project.id} compact />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <SectionHeader title="AI Insights" titleZh="AI 洞察" />
            <Link
              href={`/projects/${project.id}?section=cost-risk`}
              className="text-[10px] font-medium text-copper hover:underline shrink-0"
            >
              {t("Cost & Risk →", "成本与风险 →")}
            </Link>
          </div>

          {costRiskInsights.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                {t("Cost & Energy ROI", "成本与能效 ROI")}
              </p>
              <AIInsightList insights={costRiskInsights} compact />
            </div>
          )}

          {(() => {
            const priorityOnly = displayInsights.filter(
              (i) => i.sourceType !== COST_RISK_INSIGHT_SOURCE
            );
            if (priorityOnly.length === 0) return null;
            return (
              <div>
                {costRiskInsights.length > 0 && (
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2 mt-4">
                    {t("Priority", "优先关注")}
                  </p>
                )}
                <AIInsightList insights={priorityOnly} compact />
              </div>
            );
          })()}

          {costRiskInsights.length === 0 && displayInsights.length === 0 && (
            <p className="text-xs text-muted-foreground">
              {t(
                "Run Cost & Risk or Diagnosis workflows to populate insights.",
                "运行成本与风险或诊断流程以生成洞察。"
              )}
            </p>
          )}
        </div>
        <RecommendedActions tasks={project.tasks ?? []} projectId={project.id} />
      </div>

      <MissingInformationList items={[]} fromMemory={project.buildingMemory} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <SectionHeader title="Recent Issues" titleZh="近期问题" />
          {openIssues.length > 0 ? (
            <div className="space-y-3">
              {openIssues.slice(0, 3).map((issue) => (
                <IssueCard key={issue.id} issue={issue} compact />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{t("No open issues", "暂无待处理问题")}</p>
          )}
        </div>
        <div>
          <SectionHeader title="Recent AI Analysis" titleZh="近期 AI 分析" />
          <AnalysisRunTimeline runs={project.analysisRuns ?? []} limit={4} />
        </div>
      </div>
    </div>
  );
}
