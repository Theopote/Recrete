export type AppLocale = "zh" | "en";

export function pickLocaleText(
  locale: AppLocale,
  en: string,
  zh?: string
): string {
  return locale === "zh" && zh ? zh : en;
}
