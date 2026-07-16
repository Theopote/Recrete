import type { AppLocale } from "./locale";
import { pickLocaleText } from "./locale";

export interface BilingualString {
  en: string;
  zh: string;
}

export function bi(en: string, zh: string): BilingualString {
  return { en, zh };
}

export function pickBilingual(locale: AppLocale, text: BilingualString | string): string {
  if (typeof text === "string") return text;
  return pickLocaleText(locale, text.en, text.zh);
}
