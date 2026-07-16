import { AppShell } from "@/components/app/AppShell";
import { TopBar } from "@/components/app/TopBar";
import { CostRecordsAdminPanel } from "@/components/knowledge/CostRecordsAdminPanel";
import { KnowledgeBackLink } from "@/components/knowledge/KnowledgeBackLink";
import { listAllProjectCostRecordsWithProject } from "@/lib/db/repository";

export default async function CostRecordsPage() {
  const records = await listAllProjectCostRecordsWithProject();

  return (
    <AppShell>
      <TopBar
        title="Completed Project Costs"
        titleZh="完工项目造价库"
        subtitle={`${records.length} records`}
        subtitleZh={`${records.length} 条造价记录`}
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl space-y-4">
          <KnowledgeBackLink />
          <CostRecordsAdminPanel />
        </div>
      </main>
    </AppShell>
  );
}
