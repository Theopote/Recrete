"use client";

import { useCallback } from "react";
import { useUIStore } from "@/lib/stores/ui-store";
import { labelForLocale, pickLocaleText } from "@/lib/i18n/locale";

export function useLocale() {
  const locale = useUIStore((s) => s.locale);
  const t = useCallback(
    (en: string, zh?: string) => pickLocaleText(locale, en, zh),
    [locale]
  );
  const label = useCallback(
    <T extends string>(en: Record<T, string>, zh: Partial<Record<T, string>>, key: T) =>
      labelForLocale(locale, en, zh, key),
    [locale]
  );
  return { locale, t, label };
}
