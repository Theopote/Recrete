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
}

const MIN_TEXT_PER_PAGE = 80;

/**
 * Extract text from a PDF using pdfjs-dist (text layer only, no OCR).
 */
export async function extractPdfText(fileUrl: string): Promise<PdfExtractionResult> {
  const filePath = path.join(process.cwd(), "public", fileUrl.replace(/^\//, ""));
  const buffer = await readFile(filePath);

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
  };
}

export async function readFileAsDataUrl(
  fileUrl: string,
  mimeType: string
): Promise<string> {
  const filePath = path.join(process.cwd(), "public", fileUrl.replace(/^\//, ""));
  const buffer = await readFile(filePath);
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}
