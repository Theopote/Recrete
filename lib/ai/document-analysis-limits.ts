import "server-only";

const DEFAULT_MAX_PAGES = 8;
const DEFAULT_TIMEOUT_MS = 120_000;

export function getMaxPdfPages(): number {
  const raw = Number(process.env.DOCUMENT_ANALYSIS_MAX_PAGES ?? DEFAULT_MAX_PAGES);
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_MAX_PAGES;
  return Math.min(Math.round(raw), 20);
}

export function getDocumentAnalysisTimeoutMs(): number {
  const raw = Number(process.env.DOCUMENT_ANALYSIS_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
  if (!Number.isFinite(raw) || raw < 30_000) return DEFAULT_TIMEOUT_MS;
  return Math.min(Math.round(raw), 300_000);
}

export function buildTruncationNotice(totalPages: number, analyzedPages: number): string {
  if (analyzedPages >= totalPages) return "";
  return `\n\n⚠️ 共 ${totalPages} 页，本次已分析前 ${analyzedPages} 页。可拆分上传或联系管理员调高 DOCUMENT_ANALYSIS_MAX_PAGES。`;
}

export function formatAnalysisTimeoutError(timeoutMs: number): string {
  const seconds = Math.round(timeoutMs / 1000);
  return `文档分析超时（${seconds}s）。大 PDF/DWG 建议拆分上传，或稍后重试。`;
}
