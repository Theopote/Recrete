"use client";

import { useLocale } from "@/lib/i18n/use-locale";
import { formatDate } from "@/lib/utils";

interface KnowledgeArticleMetaProps {
  updatedAt: Date;
}

export function KnowledgeArticleMeta({ updatedAt }: KnowledgeArticleMetaProps) {
  const { t } = useLocale();

  return (
    <p className="text-[10px] text-muted-foreground mt-8 pt-4 border-t">
      {t("Last updated", "最后更新")} {formatDate(updatedAt)}
    </p>
  );
}
