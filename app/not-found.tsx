"use client";

import Link from "next/link";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/use-locale";

export default function NotFoundPage() {
  const { t } = useLocale();

  return (
    <div className="min-h-screen flex items-center justify-center bg-grid-pattern bg-grid p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
          <Building2 className="h-6 w-6 text-primary-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight">
            {t("Page not found", "页面未找到")}
          </h1>
          <p className="text-xs text-muted-foreground">
            {t(
              "The page you're looking for doesn't exist or has been moved.",
              "您访问的页面不存在或已被移动。"
            )}
          </p>
        </div>
        <Button variant="copper" asChild>
          <Link href="/dashboard">{t("Back to Dashboard", "返回工作台")}</Link>
        </Button>
      </div>
    </div>
  );
}
