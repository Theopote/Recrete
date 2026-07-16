import { AppShell } from "@/components/app/AppShell";
import { TopBar } from "@/components/app/TopBar";
import { MaterialPriceAdminPanel } from "@/components/knowledge/MaterialPriceAdminPanel";
import { KnowledgeBackLink } from "@/components/knowledge/KnowledgeBackLink";
import { listMaterialPrices } from "@/lib/db/material-prices";

export default async function MaterialPricesAdminPage() {
  const items = await listMaterialPrices();

  return (
    <AppShell>
      <TopBar
        title="Material Price Admin"
        titleZh="材料价格管理"
        subtitle={`${items.length} indexed materials`}
        subtitleZh={`${items.length} 条材料价格索引`}
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl space-y-4">
          <KnowledgeBackLink />
          <MaterialPriceAdminPanel />
        </div>
      </main>
    </AppShell>
  );
}
