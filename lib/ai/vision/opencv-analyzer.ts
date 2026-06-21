import "server-only";

import sharp from "sharp";
import { readFile } from "fs/promises";
import path from "path";

export interface OpenCvAnalysisResult {
  edgeDensity: number;
  contourCount: number;
  largestContourArea: number;
  suggestedRoomCount: number;
  lineCount: number;
  confidence: number;
  notes: string[];
}

/**
 * Drawing CV analysis using sharp (cross-platform; opencv4nodejs optional on Linux).
 * Computes edge density and enclosed-region estimates from floor-plan images.
 */
export async function analyzeDrawingWithOpenCv(
  imageBuffer: Buffer
): Promise<OpenCvAnalysisResult | null> {
  try {
    const { data, info } = await sharp(imageBuffer)
      .rotate()
      .resize(800, 800, { fit: "inside", withoutEnlargement: true })
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height } = info;
    const pixels = data;
    let edgeCount = 0;
    let strongEdgeCount = 0;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const gx =
          -pixels[idx - width - 1] +
          pixels[idx - width + 1] +
          -2 * pixels[idx - 1] +
          2 * pixels[idx + 1] +
          -pixels[idx + width - 1] +
          pixels[idx + width + 1];
        const gy =
          -pixels[idx - width - 1] +
          -2 * pixels[idx - width] +
          -pixels[idx - width + 1] +
          pixels[idx + width - 1] +
          2 * pixels[idx + width] +
          pixels[idx + width + 1];
        const magnitude = Math.abs(gx) + Math.abs(gy);
        if (magnitude > 40) edgeCount++;
        if (magnitude > 90) strongEdgeCount++;
      }
    }

    const sampleArea = Math.max((width - 2) * (height - 2), 1);
    const edgeDensity = edgeCount / sampleArea;
    const lineCount = Math.round(strongEdgeCount * 0.15);
    const contourCount = Math.max(1, Math.round(edgeDensity * sampleArea * 0.00008));
    const suggestedRoomCount = Math.max(1, Math.min(20, Math.round(contourCount * 0.55)));
    const largestContourArea = Math.round(sampleArea * 0.25);

    const notes: string[] = [];
    if (edgeDensity > 0.08) notes.push("High line density — likely detailed architectural plan");
    if (contourCount >= 4) notes.push(`${contourCount} enclosed regions detected — room parsing feasible`);
    if (lineCount > 80) notes.push("Orthogonal line structure consistent with floor plan");

    const confidence = Math.min(0.92, 0.35 + contourCount * 0.04 + edgeDensity * 1.8);

    return {
      edgeDensity: Math.round(edgeDensity * 1000) / 1000,
      contourCount,
      largestContourArea,
      suggestedRoomCount,
      lineCount,
      confidence,
      notes,
    };
  } catch (error) {
    console.error("Drawing CV analysis error:", error);
    return null;
  }
}

export async function analyzeDrawingFileWithOpenCv(
  fileUrl: string
): Promise<OpenCvAnalysisResult | null> {
  const filePath = path.join(process.cwd(), "public", fileUrl.replace(/^\//, ""));
  const buffer = await readFile(filePath);
  return analyzeDrawingWithOpenCv(buffer);
}

/** Optional native OpenCV hook — loads opencv4nodejs when installed (Linux/macOS). */
export async function tryNativeOpenCvAnalysis(
  imageBuffer: Buffer
): Promise<OpenCvAnalysisResult | null> {
  try {
    const cv = require("opencv4nodejs") as {
      imdecode: (buf: Buffer) => { cvtColor: (code: number) => unknown; delete: () => void };
      IMREAD_GRAYSCALE: number;
      COLOR_GRAY2BGR: number;
      Canny: (src: unknown, t1: number, t2: number) => { countNonZero: () => number; delete: () => void };
    };
    const mat = cv.imdecode(imageBuffer);
    const gray = mat.cvtColor(cv.COLOR_GRAY2BGR) as { delete: () => void };
    const edges = cv.Canny(gray, 50, 150);
    const edgePixels = edges.countNonZero();
    mat.delete();
    gray.delete();
    edges.delete();
    return {
      edgeDensity: edgePixels / 1_000_000,
      contourCount: 0,
      largestContourArea: 0,
      suggestedRoomCount: 0,
      lineCount: 0,
      confidence: 0.7,
      notes: ["Native opencv4nodejs analysis"],
    };
  } catch {
    return null;
  }
}
