import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { TopBar } from "@/components/app/TopBar";
import { MaterialPriceAdminPanel } from "@/components/knowledge/MaterialPriceAdminPanel";
import { Button } from "@/components/ui/button";
import { listMaterialPrices } from "@/lib/db/material-prices";
import { ArrowLeft } from "lucide-react";

export default async function MaterialPricesAdminPage() {
  const items = await listMaterialPrices();

  return (
    <AppShell>
      <TopBar
        title="Material Price Admin"
        subtitle={`${items.length} indexed materials · 材料价格管理`}
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl space-y-4">
          <Button variant="ghost" size="sm" className="gap-1.5 -ml-2" asChild>
            <Link href="/knowledge">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Knowledge Base
            </Link>
          </Button>
          <MaterialPriceAdminPanel />
        </div>
      </main>
    </AppShell>
  );
}
