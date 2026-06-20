import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { TopBar } from "@/components/app/TopBar";
import { SectionHeader } from "@/components/app/SectionHeader";
import { StrategyCard } from "@/components/strategies/StrategyCard";
import { getAllStrategies } from "@/lib/db/repository";
import { ExternalLink } from "lucide-react";

export default async function GlobalStrategiesPage() {
  const strategies = await getAllStrategies();

  return (
    <AppShell>
      <TopBar title="Design Strategies" subtitle={`${strategies.length} strategies across projects`} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <SectionHeader
            title="Renovation Strategies"
            description="Overview of all renovation strategy options being evaluated"
          />
          <div className="space-y-4">
            {strategies.map((strategy) => (
              <div key={strategy.id} className="relative">
                <Link
                  href={`/projects/${strategy.projectId}?section=strategies`}
                  className="absolute top-5 right-5 z-10 flex items-center gap-1 text-xs text-copper hover:underline"
                >
                  {strategy.projectName} <ExternalLink className="h-3 w-3" />
                </Link>
                <StrategyCard
                  strategy={strategy}
                  isRecommended={!!strategy.recommendationReason}
                />
              </div>
            ))}
          </div>
        </div>
      </main>
    </AppShell>
  );
}
