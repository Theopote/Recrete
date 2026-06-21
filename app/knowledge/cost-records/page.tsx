import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { TopBar } from "@/components/app/TopBar";
import { CostRecordsAdminPanel } from "@/components/knowledge/CostRecordsAdminPanel";
import { Button } from "@/components/ui/button";
import { listAllProjectCostRecordsWithProject } from "@/lib/db/repository";
import { ArrowLeft } from "lucide-react";

export default async function CostRecordsPage() {
  const records = await listAllProjectCostRecordsWithProject();

  return (
    <AppShell>
      <TopBar
        title="Completed Project Costs"
        subtitle={`${records.length} records · 完工造价库`}
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl space-y-4">
          <Button variant="ghost" size="sm" className="gap-1.5 -ml-2" asChild>
            <Link href="/knowledge">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Knowledge Base
            </Link>
          </Button>
          <CostRecordsAdminPanel />
        </div>
      </main>
    </AppShell>
  );
}
