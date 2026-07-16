import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { AppShell } from "@/components/app/AppShell";
import { TopBar } from "@/components/app/TopBar";
import { Card, CardContent } from "@/components/ui/card";
import { KnowledgeBackLink } from "@/components/knowledge/KnowledgeBackLink";
import { KnowledgeArticleMeta } from "@/components/knowledge/KnowledgeArticleMeta";
import { getKnowledgeArticle } from "@/lib/db/repository";
import { Tag } from "lucide-react";

interface KnowledgeArticlePageProps {
  params: Promise<{ articleId: string }>;
}

export default async function KnowledgeArticlePage({ params }: KnowledgeArticlePageProps) {
  const { articleId } = await params;
  const article = await getKnowledgeArticle(articleId);
  if (!article) notFound();

  return (
    <AppShell>
      <TopBar title={article.title} subtitle={article.category} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <KnowledgeBackLink />

          <Card>
            <CardContent className="p-8">
              <p className="text-xs text-muted-foreground mb-2">{article.category}</p>
              <h1 className="text-xl font-semibold mb-3">{article.title}</h1>
              <p className="text-sm text-muted-foreground mb-4">{article.summary}</p>
              <div className="flex flex-wrap gap-1 mb-6">
                {article.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-0.5 rounded bg-muted px-2 py-0.5 text-[10px]">
                    <Tag className="h-2.5 w-2.5" /> {tag}
                  </span>
                ))}
              </div>
              <article className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground/80">
                <ReactMarkdown>{article.content}</ReactMarkdown>
              </article>
              <KnowledgeArticleMeta updatedAt={article.updatedAt} />
            </CardContent>
          </Card>
        </div>
      </main>
    </AppShell>
  );
}
