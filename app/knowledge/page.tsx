import { AppShell } from "@/components/app/AppShell";
import { TopBar } from "@/components/app/TopBar";
import { SectionHeader } from "@/components/app/SectionHeader";
import { KnowledgeBaseGrid } from "@/components/knowledge/KnowledgeBaseGrid";
import { Button } from "@/components/ui/button";
import { getKnowledgeArticles } from "@/lib/db/repository";
import Link from "next/link";
import { TrendingUp, ClipboardList } from "lucide-react";

export default async function KnowledgePage() {
  const articles = await getKnowledgeArticles();

  return (
    <AppShell>
      <TopBar title="Knowledge Base" subtitle={`${articles.length} reference articles`} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <SectionHeader
            title="Renovation Knowledge Base"
            description="Best practices, checklists, and reference guides for existing building renovation"
            action={
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/knowledge/cost-records">
                    <ClipboardList className="mr-1.5 h-3.5 w-3.5" />
                    Cost Records · 完工造价
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/knowledge/material-prices">
                    <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
                    Material Prices · 材料价格
                  </Link>
                </Button>
              </div>
            }
          />
          <KnowledgeBaseGrid articles={articles} />
        </div>
      </main>
    </AppShell>
  );
}
