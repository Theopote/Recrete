"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/use-locale";

export function KnowledgeBackLink() {
  const { t } = useLocale();

  return (
    <Button variant="ghost" size="sm" className="gap-1.5 -ml-2" asChild>
      <Link href="/knowledge">
        <ArrowLeft className="h-3.5 w-3.5" />
        {t("Back to Knowledge Base", "返回知识库")}
      </Link>
    </Button>
  );
}
