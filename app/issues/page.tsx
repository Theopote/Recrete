import { AppShell } from "@/components/app/AppShell";
import { TopBar } from "@/components/app/TopBar";
import { SectionHeader } from "@/components/app/SectionHeader";
import { GlobalIssuesList } from "@/components/issues/GlobalIssuesList";
import { getAllIssues } from "@/lib/db/repository";

export default async function GlobalIssuesPage() {
  const issues = await getAllIssues();

  return (
    <AppShell>
      <TopBar title="Issues" subtitle={`${issues.length} site issues tracked`} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title="Site Issue Tracker"
            description="All open and resolved site issues across renovation projects"
          />
          <GlobalIssuesList issues={issues} />
        </div>
      </main>
    </AppShell>
  );
}
