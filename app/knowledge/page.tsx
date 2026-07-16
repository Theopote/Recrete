import { AppShell } from "@/components/app/AppShell";
import { TopBar } from "@/components/app/TopBar";
import { SectionHeader } from "@/components/app/SectionHeader";
import { KnowledgeBaseGrid } from "@/components/knowledge/KnowledgeBaseGrid";
import { KnowledgePageActions } from "@/components/knowledge/KnowledgePageActions";
import { getKnowledgeArticles } from "@/lib/db/repository";

export default async function KnowledgePage() {
  const articles = await getKnowledgeArticles();

  return (
    <AppShell>
      <TopBar
        title="Knowledge Base"
        titleZh="知识库"
        subtitle={`${articles.length} reference articles`}
        subtitleZh={`${articles.length} 篇参考文章`}
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <SectionHeader
            title="Renovation Knowledge Base"
            titleZh="改造知识库"
            description="Best practices, checklists, and reference guides for existing building renovation"
            descriptionZh="既有建筑改造的最佳实践、检查清单与参考指南"
            action={<KnowledgePageActions />}
          />
          <KnowledgeBaseGrid articles={articles} />
        </div>
      </main>
    </AppShell>
  );
}
