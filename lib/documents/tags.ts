/** Parse comma-separated or JSON-array tag input for document governance. */
export function parseTagsInput(input: string | string[] | null | undefined): string[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return uniqueTags(input.map((t) => t.trim()).filter(Boolean));
  }

  const trimmed = input.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return uniqueTags(parsed.filter((t): t is string => typeof t === "string").map((t) => t.trim()));
      }
    } catch {
      // fall through to comma split
    }
  }

  return uniqueTags(
    trimmed
      .split(/[,，;；]/)
      .map((t) => t.trim())
      .filter(Boolean)
  );
}

export function serializeTagsForStorage(tags: string[] | null | undefined): string | null {
  const normalized = uniqueTags(tags ?? []);
  return normalized.length > 0 ? JSON.stringify(normalized) : null;
}

export function parseTagsFromStorage(stored: string | null | undefined): string[] {
  if (!stored?.trim()) return [];
  try {
    const parsed = JSON.parse(stored) as unknown;
    if (Array.isArray(parsed)) {
      return uniqueTags(parsed.filter((t): t is string => typeof t === "string"));
    }
  } catch {
    return parseTagsInput(stored);
  }
  return [];
}

function uniqueTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of tags) {
    const key = tag.toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
  }
  return out.slice(0, 24);
}
