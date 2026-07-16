import { AppShell } from "@/components/app/AppShell";
import { TopBar } from "@/components/app/TopBar";
import { SectionHeader } from "@/components/app/SectionHeader";
import { GlobalReportsPageContent } from "@/components/reports/GlobalReportsPageContent";
import { getAllReports } from "@/lib/db/repository";

export default async function GlobalReportsPage() {
  const reports = await getAllReports();

  return (
    <AppShell>
      <TopBar
        title="Reports"
        titleZh="报告"
        subtitle={`${reports.length} generated reports`}
        subtitleZh={`共 ${reports.length} 份报告`}
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <SectionHeader
            title="Project Reports"
            titleZh="项目报告"
            description="All generated reports across renovation projects"
            descriptionZh="跨项目查看所有已生成的报告"
          />
          <GlobalReportsPageContent reports={reports} />
        </div>
      </main>
    </AppShell>
  );
}
