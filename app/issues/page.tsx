import { AppShell } from "@/components/app/AppShell";
import { TopBar } from "@/components/app/TopBar";
import { SectionHeader } from "@/components/app/SectionHeader";
import { GlobalIssuesList } from "@/components/issues/GlobalIssuesList";
import { getAllIssues } from "@/lib/db/repository";

export default async function GlobalIssuesPage() {
  const issues = await getAllIssues();

  return (
    <AppShell>
      <TopBar
        title="Issues"
        titleZh="现场问题"
        subtitle={`${issues.length} site issues tracked`}
        subtitleZh={`共跟踪 ${issues.length} 个现场问题`}
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title="Site Issue Tracker"
            titleZh="现场问题跟踪"
            description="All open and resolved site issues across renovation projects"
            descriptionZh="跨项目查看所有开放与已关闭的现场问题"
          />
          <GlobalIssuesList issues={issues} />
        </div>
      </main>
    </AppShell>
  );
}
