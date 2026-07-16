"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/use-locale";
import { TrendingUp, ClipboardList } from "lucide-react";

export function KnowledgePageActions() {
  const { t } = useLocale();

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href="/knowledge/cost-records">
          <ClipboardList className="mr-1.5 h-3.5 w-3.5" />
          {t("Cost Records", "完工造价")}
        </Link>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link href="/knowledge/material-prices">
          <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
          {t("Material Prices", "材料价格")}
        </Link>
      </Button>
    </div>
  );
}
