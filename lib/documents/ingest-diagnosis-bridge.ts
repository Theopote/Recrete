export interface IngestCompletionMeta {
  evidenceCount: number;
  suggestDiagnosis: boolean;
}

export function formatIngestCompletionMessage(
  docName: string,
  kind: string,
  evidenceCount: number
): string {
  const suggest = evidenceCount > 0 ? " · suggest_diagnosis" : "";
  return `Analyzed ${docName} (${kind}) · ${evidenceCount} evidence${suggest}`;
}

export function parseIngestCompletionMessage(message?: string | null): IngestCompletionMeta {
  if (!message) return { evidenceCount: 0, suggestDiagnosis: false };
  const evidenceMatch = message.match(/(\d+)\s+evidence/);
  return {
    evidenceCount: evidenceMatch ? Number(evidenceMatch[1]) : 0,
    suggestDiagnosis: message.includes("suggest_diagnosis"),
  };
}
