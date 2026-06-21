export function isPdf(mimeType: string, fileName: string): boolean {
  return mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
}

export function isPreviewable(mimeType: string, fileName: string): boolean {
  return isPdf(mimeType, fileName) || mimeType.startsWith("image/");
}
