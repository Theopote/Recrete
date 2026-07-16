"use client";

import Link from "next/link";
import { TopBar } from "@/components/app/TopBar";
import { MetricCard } from "@/components/app/MetricCard";
import { ProjectCard } from "@/components/app/ProjectCard";
import { SectionHeader } from "@/components/app/SectionHeader";
import { Card, CardContent } from "@/components/ui/card";
import { AIInsightList } from "@/components/ai/AIInsightList";
import { AIReadinessScore } from "@/components/ai/AIReadinessScore";
import { DataCompletenessScore } from "@/components/ai/DataCompletenessScore";
import { RecommendedActions } from "@/components/ai/RecommendedActions";
import { AnalysisRunTimeline } from "@/components/ai/AnalysisRunTimeline";
import { MissingInformationList } from "@/components/ai/MissingInformationList";
import { CommandCenterActions } from "@/app/dashboard/CommandCenterActions";
import { useLocale } from "@/lib/i18n/use-locale";
import type { getCommandCenterData } from "@/lib/db/repository";
import { Sparkles, Brain, AlertTriangle, FileText, FolderKanban } from "lucide-react";

type CommandCenterData = Awaited<ReturnType<typeof getCommandCenterData>>;

interface DashboardPageContentProps {
  data: CommandCenterData;
}

export function DashboardPageContent({ data }: DashboardPageContentProps) {
  const { t } = useLocale();
  const activeProjects = data.projects.filter(
    (p) => p.status !== "archived" && p.status !== "completed"
  );

  return (
    <>
      <TopBar
        title="AI Command Center"
        titleZh="AI 指挥中心"
        subtitle="AI Copilot for Existing Building Renovation"
        subtitleZh="面向既有建筑更新的 AI 设计助手"
        showNewProject
      />
      <main className="flex-1 overflow-y-auto p-6 bg-grid-pattern bg-grid">
        <div className="mx-auto max-w-7xl space-y-8">
          <CommandCenterActions />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title={t("Active Projects", "活跃项目")}
              value={activeProjects.length}
              icon={FolderKanban}
            />
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <AIReadinessScore score={data.avgAiReadiness} size={56} />
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("Avg AI Readiness", "平均 AI 就绪度")}
                  </p>
                  <p className="text-lg font-semibold tabular-nums">{data.avgAiReadiness}%</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <DataCompletenessScore score={data.avgDataCompleteness} />
              </CardContent>
            </Card>
            <MetricCard
              title={t("High-Risk Insights", "高风险洞察")}
              value={data.highRiskInsightCount}
              icon={AlertTriangle}
              trend={t(
                `${data.missingInfoCount} missing info alerts`,
                `${data.missingInfoCount} 条缺失信息提醒`
              )}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <SectionHeader
                  title="Active Projects"
                  titleZh="活跃项目"
                  description="AI-enriched project intelligence"
                  descriptionZh="AI 增强的项目智能概览"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.projects.slice(0, 4).map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </div>

              <div>
                <SectionHeader
                  title="High-Risk AI Insights"
                  titleZh="高风险 AI 洞察"
                />
                <AIInsightList
                  insights={data.insights
                    .filter((i) => i.priority === "high" || i.priority === "critical")
                    .slice(0, 4)}
                  compact
                />
              </div>

              <div>
                <SectionHeader
                  title="Recent AI Analysis Runs"
                  titleZh="近期 AI 分析记录"
                />
                <Card>
                  <CardContent className="p-4">
                    <AnalysisRunTimeline runs={data.analysisRuns} limit={5} />
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-6">
              <RecommendedActions tasks={data.tasks} projectId="proj-demo" />

              <MissingInformationList
                items={data.insights
                  .filter((i) => i.type === "missing_info")
                  .map((i) => i.title)
                  .slice(0, 6)}
              />

              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="h-4 w-4 text-copper" />
                    <h3 className="text-sm font-medium">
                      {t("Building Memory", "建筑记忆")}
                    </h3>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground mb-3">
                    {t(
                      "Persistent AI understanding powers diagnosis, strategy, and copilot recommendations across all projects.",
                      "持久化的 AI 理解支撑各项目的诊断、方案与 Copilot 建议。"
                    )}
                  </p>
                  <Link
                    href="/projects/proj-demo?section=building-memory"
                    className="text-xs font-medium text-copper hover:underline"
                  >
                    {t("View demo project memory →", "查看演示项目记忆 →")}
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium">
                      {t("Recent Reports", "近期报告")}
                    </h3>
                  </div>
                  <Link
                    href="/projects/proj-demo?section=reports"
                    prefetch
                    className="block text-xs text-muted-foreground hover:text-foreground no-underline"
                  >
                    Existing Condition Summary — May 2026
                  </Link>
                  <Link
                    href="/reports"
                    className="mt-2 inline-block text-[10px] font-medium text-copper hover:underline"
                  >
                    {t("View all reports", "查看全部报告")}
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-copper/20 bg-copper/5">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-copper" />
                    <h3 className="text-sm font-medium">
                      {t("AI-Native Platform", "AI 原生平台")}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t(
                      "Every module — Building Memory, Survey Intelligence, Diagnosis, Strategy Lab, Cost & Risk — is powered by specialized AI agents with full analysis audit trails.",
                      "建筑记忆、勘察智能、诊断、策略实验室、成本与风险等模块均由专项 AI Agent 驱动，并保留完整分析审计记录。"
                    )}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
