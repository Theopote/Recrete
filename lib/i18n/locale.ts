export type AppLocale = "zh" | "en";

export function pickLocaleText(
  locale: AppLocale,
  en: string,
  zh?: string
): string {
  return locale === "zh" && zh ? zh : en;
}

export function labelForLocale<T extends string>(
  locale: AppLocale,
  en: Record<T, string>,
  zh: Partial<Record<T, string>>,
  key: T
): string {
  if (locale === "zh" && zh[key]) return zh[key]!;
  return en[key];
}
