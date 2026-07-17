import type { DocumentStructuredExtract, StoredDocumentExtract } from "@/types/document-facts";

export function wrapExtractedText(
  rawText: string,
  structured?: DocumentStructuredExtract
): string {
  const payload: StoredDocumentExtract = {
    version: 1,
    rawTextPreview: rawText.slice(0, 12000),
    structured,
  };
  return JSON.stringify(payload);
}

export function parseStoredDocumentExtract(
  stored: string | null | undefined
): StoredDocumentExtract | null {
  if (!stored?.trim()) return null;
  try {
    const parsed = JSON.parse(stored) as StoredDocumentExtract;
    if (parsed && parsed.version === 1) return parsed;
  } catch {
    return { version: 1, rawTextPreview: stored, structured: undefined };
  }
  return null;
}

export function structuredSummaryForDisplay(extract: DocumentStructuredExtract): string {
  if (extract.kind === "regulations") {
    const top = extract.facts.slice(0, 3).map((f) => `[${f.codeRef}] ${f.requirement.slice(0, 80)}`);
    return `${extract.summary}\n${top.join("\n")}`;
  }
  const top = extract.facts.slice(0, 4).map((f) => `${f.label}: ${f.value.slice(0, 80)}`);
  return `${extract.summary}\n${top.join("\n")}`;
}

export function memoryFactsFromStructuredExtract(
  extract: DocumentStructuredExtract,
  documentName: string
): {
  knownFacts: string[];
  ownerRequirements: string[];
  designConstraints: string[];
} {
  const knownFacts: string[] = [];
  const ownerRequirements: string[] = [];
  const designConstraints: string[] = [];

  if (extract.kind === "regulations") {
    for (const fact of extract.facts.slice(0, 6)) {
      designConstraints.push(
        `[${documentName} / ${fact.codeRef}] ${fact.requirement.slice(0, 160)}`
      );
    }
    knownFacts.push(`Regulation extract (${documentName}): ${extract.summary.slice(0, 160)}`);
  } else {
    for (const fact of extract.facts.slice(0, 8)) {
      const line = `[${documentName}] ${fact.label}: ${fact.value.slice(0, 140)}`;
      if (fact.field === "constraint") designConstraints.push(line);
      else if (fact.field === "objective" || fact.field === "program") ownerRequirements.push(line);
      else knownFacts.push(line);
    }
    ownerRequirements.push(`Brief summary (${documentName}): ${extract.summary.slice(0, 140)}`);
  }

  return { knownFacts, ownerRequirements, designConstraints };
}
