"use client";

import { Button } from "@/components/ui/button";
import { useUIStore } from "@/lib/stores/ui-store";

export function LanguageToggle() {
  const locale = useUIStore((s) => s.locale);
  const toggleLocale = useUIStore((s) => s.toggleLocale);

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 px-2 text-xs font-medium min-w-[44px]"
      onClick={toggleLocale}
      title={locale === "zh" ? "Switch to English" : "切换为中文"}
    >
      {locale === "zh" ? "中" : "EN"}
    </Button>
  );
}
