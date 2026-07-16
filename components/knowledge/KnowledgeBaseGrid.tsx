"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/use-locale";
import type { KnowledgeArticle } from "@/types";
import { BookOpen, Tag } from "lucide-react";

interface KnowledgeBaseGridProps {
  articles: KnowledgeArticle[];
}

export function KnowledgeBaseGrid({ articles }: KnowledgeBaseGridProps) {
  const { t } = useLocale();
  const categories = [...new Set(articles.map((a) => a.category))];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <span key={cat} className="rounded-full border px-3 py-1 text-xs font-medium">
            {cat} ({articles.filter((a) => a.category === cat).length})
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {articles.map((article) => (
          <Link key={article.id} href={`/knowledge/${article.id}`}>
            <Card className="h-full hover:border-copper/40 transition-colors">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start gap-2">
                  <BookOpen className="h-4 w-4 text-copper shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {article.category}
                    </p>
                    <h3 className="text-sm font-medium leading-tight mt-0.5">{article.title}</h3>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-3">{article.summary}</p>
                <div className="flex flex-wrap gap-1">
                  {article.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      <Tag className="h-2.5 w-2.5" /> {tag}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {t("Updated", "更新于")} {formatDate(article.updatedAt)}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
