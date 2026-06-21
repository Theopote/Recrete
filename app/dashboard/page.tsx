import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
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
import { CommandCenterActions } from "./CommandCenterActions";
import { getCommandCenterData } from "@/lib/db/repository";
import {
  Sparkles,
  Brain,
  AlertTriangle,
  FileText,
  FolderKanban,
} from "lucide-react";

export default async function DashboardPage() {
  const data = await getCommandCenterData();

  return (
    <AppShell>
      <TopBar
        title="AI Command Center"
        subtitle="AI Copilot for Existing Building Renovation · 面向既有建筑更新的 AI 设计助手"
        showNewProject
      />
      <main className="flex-1 overflow-y-auto p-6 bg-grid-pattern bg-grid">
        <div className="mx-auto max-w-7xl space-y-8">
          <CommandCenterActions />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Active Projects"
              value={data.projects.filter((p) => p.status !== "archived" && p.status !== "completed").length}
              icon={FolderKanban}
            />
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <AIReadinessScore score={data.avgAiReadiness} size={56} />
                <div>
                  <p className="text-xs text-muted-foreground">Avg AI Readiness</p>
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
              title="High-Risk Insights"
              value={data.highRiskInsightCount}
              icon={AlertTriangle}
              trend={`${data.missingInfoCount} missing info alerts`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <SectionHeader
                  title="Active Projects"
                  description="AI-enriched project intelligence"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.projects.slice(0, 4).map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </div>

              <div>
                <SectionHeader title="High-Risk AI Insights" />
                <AIInsightList
                  insights={data.insights
                    .filter((i) => i.priority === "high" || i.priority === "critical")
                    .slice(0, 4)}
                  compact
                />
              </div>

              <div>
                <SectionHeader title="Recent AI Analysis Runs" />
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
                    <h3 className="text-sm font-medium">Building Memory</h3>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground mb-3">
                    Persistent AI understanding powers diagnosis, strategy, and copilot recommendations across all projects.
                  </p>
                  <Link
                    href="/projects/proj-demo?section=building-memory"
                    className="text-xs font-medium text-copper hover:underline"
                  >
                    View demo project memory →
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium">Recent Reports</h3>
                  </div>
                  <Link
                    href="/projects/proj-demo?section=reports"
                    className="block text-xs text-muted-foreground hover:text-foreground"
                  >
                    Existing Condition Summary — May 2026
                  </Link>
                  <Link
                    href="/reports"
                    className="mt-2 inline-block text-[10px] font-medium text-copper hover:underline"
                  >
                    View all reports
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-copper/20 bg-copper/5">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-copper" />
                    <h3 className="text-sm font-medium">AI-Native Platform</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Every module — Building Memory, Survey Intelligence, Diagnosis, Strategy Lab, Cost & Risk — is powered by specialized AI agents with full analysis audit trails.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
