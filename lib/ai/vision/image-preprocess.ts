import "server-only";

import sharp from "sharp";

export interface ImagePreprocessOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/**
 * Resize and normalize images before Vision AI analysis (uses sharp).
 */
export async function preprocessImageForVision(
  input: Buffer,
  options: ImagePreprocessOptions = {}
): Promise<{ buffer: Buffer; mimeType: "image/jpeg" }> {
  const { maxWidth = 2048, maxHeight = 2048, quality = 85 } = options;

  const buffer = await sharp(input)
    .rotate()
    .resize(maxWidth, maxHeight, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();

  return { buffer, mimeType: "image/jpeg" };
}

export async function generateDrawingThumbnail(
  input: Buffer,
  width = 480
): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize(width, undefined, { fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();
}
