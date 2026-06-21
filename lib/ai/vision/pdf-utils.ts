import "server-only";

import { readFile } from "fs/promises";
import path from "path";

export interface PdfTextPage {
  pageNumber: number;
  text: string;
}

export interface PdfExtractionResult {
  pages: PdfTextPage[];
  fullText: string;
  pageCount: number;
  isLikelyScan: boolean;
  extractor: "pdf-parse" | "pdfjs-dist";
}

const MIN_TEXT_PER_PAGE = 80;

async function extractWithPdfParse(buffer: Buffer): Promise<PdfExtractionResult | null> {
  try {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    const fullText = (data.text ?? "").replace(/\s+/g, " ").trim();
    const pageCount = data.numpages ?? 1;
    const avgLen = fullText.length / Math.max(pageCount, 1);

    return {
      pages: [{ pageNumber: 1, text: fullText }],
      fullText,
      pageCount,
      isLikelyScan: avgLen < MIN_TEXT_PER_PAGE,
      extractor: "pdf-parse",
    };
  } catch {
    return null;
  }
}

async function extractWithPdfJs(buffer: Buffer): Promise<PdfExtractionResult> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer), useSystemFonts: true });
  const pdf = await loadingTask.promise;

  const pages: PdfTextPage[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const text = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    pages.push({ pageNumber: i, text });
  }

  const fullText = pages.map((p) => p.text).join("\n\n");
  const avgTextLen =
    pages.length > 0 ? pages.reduce((sum, p) => sum + p.text.length, 0) / pages.length : 0;

  return {
    pages,
    fullText,
    pageCount: pdf.numPages,
    isLikelyScan: avgTextLen < MIN_TEXT_PER_PAGE,
    extractor: "pdfjs-dist",
  };
}

/**
 * Extract text from PDF — tries pdf-parse first (faster for text PDFs), falls back to pdfjs-dist.
 */
export async function extractPdfText(fileUrl: string): Promise<PdfExtractionResult> {
  const filePath = path.join(process.cwd(), "public", fileUrl.replace(/^\//, ""));
  const buffer = await readFile(filePath);

  const parsed = await extractWithPdfParse(buffer);
  if (parsed && parsed.fullText.length > 50) {
    return parsed;
  }

  const pdfjsResult = await extractWithPdfJs(buffer);
  if (parsed?.fullText && parsed.fullText.length > pdfjsResult.fullText.length) {
    return parsed;
  }

  return pdfjsResult;
}

export async function readFileAsDataUrl(
  fileUrl: string,
  mimeType: string
): Promise<string> {
  const filePath = path.join(process.cwd(), "public", fileUrl.replace(/^\//, ""));
  const buffer = await readFile(filePath);
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}
