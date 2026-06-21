import "server-only";

import { readFile } from "fs/promises";
import path from "path";
import { preprocessImageForVision } from "./image-preprocess";

export interface OpenCvAnalysisResult {
  edgeDensity: number;
  contourCount: number;
  largestContourArea: number;
  suggestedRoomCount: number;
  lineCount: number;
  confidence: number;
  notes: string[];
}

let cvModule: typeof import("@techstark/opencv-js") | null = null;

async function loadOpenCv() {
  if (cvModule) return cvModule;
  try {
    cvModule = await import("@techstark/opencv-js");
    return cvModule;
  } catch {
    return null;
  }
}

/**
 * Floor-plan computer vision analysis using OpenCV (WASM).
 * Supplements Vision AI with geometric signals: edges, contours, line density.
 */
export async function analyzeDrawingWithOpenCv(
  imageBuffer: Buffer
): Promise<OpenCvAnalysisResult | null> {
  const cv = await loadOpenCv();
  if (!cv) return null;

  try {
    const { buffer } = await preprocessImageForVision(imageBuffer, {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 90,
    });

    const mat = cv.imdecode(new Uint8Array(buffer), cv.IMREAD_GRAYSCALE);
    const blurred = new cv.Mat();
    cv.GaussianBlur(mat, blurred, new cv.Size(5, 5), 0);

    const edges = new cv.Mat();
    cv.Canny(blurred, edges, 50, 150);

    const edgePixels = cv.countNonZero(edges);
    const edgeDensity = edgePixels / Math.max(mat.rows * mat.cols, 1);

    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(edges, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);

    let largestArea = 0;
    let significantContours = 0;
    const minArea = (mat.rows * mat.cols) * 0.002;

    for (let i = 0; i < contours.size(); i++) {
      const area = cv.contourArea(contours.get(i));
      if (area > minArea) significantContours++;
      if (area > largestArea) largestArea = area;
    }

    const lines = new cv.Mat();
    cv.HoughLinesP(edges, lines, 1, Math.PI / 180, 80, 50, 10);
    const lineCount = lines.rows;

    mat.delete();
    blurred.delete();
    edges.delete();
    contours.delete();
    hierarchy.delete();
    lines.delete();

    const suggestedRoomCount = Math.max(1, Math.min(20, Math.round(significantContours * 0.6)));
    const notes: string[] = [];

    if (edgeDensity > 0.08) notes.push("High line density — likely detailed architectural plan");
    if (significantContours >= 4) notes.push(`${significantContours} enclosed regions detected — room parsing feasible`);
    if (lineCount > 100) notes.push("Orthogonal line structure consistent with floor plan");

    return {
      edgeDensity: Math.round(edgeDensity * 1000) / 1000,
      contourCount: significantContours,
      largestContourArea: Math.round(largestArea),
      suggestedRoomCount,
      lineCount,
      confidence: Math.min(0.95, 0.4 + significantContours * 0.05 + edgeDensity * 2),
      notes,
    };
  } catch (error) {
    console.error("OpenCV analysis error:", error);
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
