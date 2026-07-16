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

export function isBilingualString(value: unknown): value is BilingualString {
  return (
    typeof value === "object" &&
    value !== null &&
    "en" in value &&
    "zh" in value &&
    typeof (value as BilingualString).en === "string" &&
    typeof (value as BilingualString).zh === "string"
  );
}

/** Serialize bilingual text for DB storage (JSON if bilingual, plain string otherwise). */
export function serializeForStorage(
  text: BilingualString | string | undefined | null
): string | null {
  if (text == null) return null;
  if (typeof text === "string") return text;
  return JSON.stringify(text);
}

/** Parse stored remediation/recommendation — supports legacy plain strings. */
export function parseFromStorage(
  stored: string | null | undefined
): BilingualString | string | undefined {
  if (!stored) return undefined;
  const trimmed = stored.trim();
  if (trimmed.startsWith("{")) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (isBilingualString(parsed)) return parsed;
    } catch {
      /* legacy plain string */
    }
  }
  return stored;
}

export function serializeListForStorage(items: Array<BilingualString | string>): string[] {
  return items.map((item) => serializeForStorage(item)!);
}

export function parseListFromStorage(items: string[]): Array<BilingualString | string> {
  return items.map((item) => parseFromStorage(item) ?? item);
}

export function bilingualKey(text: BilingualString | string): string {
  return typeof text === "string" ? text : text.en;
}
