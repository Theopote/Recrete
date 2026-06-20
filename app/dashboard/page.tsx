import { AppShell } from "@/components/app/AppShell";
import { TopBar } from "@/components/app/TopBar";
import { MetricCard } from "@/components/app/MetricCard";
import { ProjectCard } from "@/components/app/ProjectCard";
import { SectionHeader } from "@/components/app/SectionHeader";
import { Card, CardContent } from "@/components/ui/card";
import { DiagnosisCard } from "@/components/diagnosis/DiagnosisCard";
import { getDashboardData } from "@/lib/db/repository";
import { projectStatusLabels } from "@/lib/utils/labels";
import {
  FolderKanban,
  Activity,
  AlertTriangle,
  ClipboardList,
  Sparkles,
  BarChart3,
} from "lucide-react";

export default async function DashboardPage() {
  const { stats, recentProjects, recentDiagnosis, aiInsights } = await getDashboardData();

  return (
    <AppShell>
      <TopBar
        title="Dashboard"
        subtitle="Renovation command center"
        showNewProject
      />
      <main className="flex-1 overflow-y-auto p-6 bg-grid-pattern bg-grid">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Projects"
              value={stats.totalProjects}
              icon={FolderKanban}
            />
            <MetricCard
              title="Active Projects"
              value={stats.activeProjects}
              icon={Activity}
              trend="In survey, diagnosis, or design"
            />
            <MetricCard
              title="High Risk Projects"
              value={stats.highRiskProjects}
              icon={AlertTriangle}
            />
            <MetricCard
              title="Pending Issues"
              value={stats.pendingIssues}
              icon={ClipboardList}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <SectionHeader title="Recent Projects" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recentProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </div>

              <div>
                <SectionHeader title="Recent Diagnosis Items" />
                <div className="grid grid-cols-1 gap-3">
                  {recentDiagnosis.map((item) => (
                    <DiagnosisCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-copper" />
                    <h3 className="text-sm font-medium">AI Insights</h3>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {aiInsights}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium">Status Distribution</h3>
                  </div>
                  <div className="space-y-3">
                    {stats.statusDistribution.map(({ status, count }) => (
                      <div key={status}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">
                            {projectStatusLabels[status]}
                          </span>
                          <span className="font-medium tabular-nums">{count}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-copper rounded-full"
                            style={{
                              width: `${(count / stats.totalProjects) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
