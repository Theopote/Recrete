import { AppShell } from "@/components/app/AppShell";
import { TopBar } from "@/components/app/TopBar";
import { SectionHeader } from "@/components/app/SectionHeader";
import { KnowledgeBaseGrid } from "@/components/knowledge/KnowledgeBaseGrid";
import { getKnowledgeArticles } from "@/lib/db/repository";

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
          />
          <KnowledgeBaseGrid articles={articles} />
        </div>
      </main>
    </AppShell>
  );
}
