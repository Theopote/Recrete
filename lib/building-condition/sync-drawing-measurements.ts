import { listDrawingAssetsByProject } from "@/lib/db/drawing-assets";
import { updateProjectSiteMeasurements } from "@/lib/db/site-measurements-store";
import type { DrawingAnalysisResult } from "@/lib/ai/vision/types";
import type { DrawingAssetRecord } from "@/types/drawing";
import type { ProjectSiteMeasurementsDto } from "@/types/site-measurements";
import type { DrawingMeasurementExtraction } from "@/types/drawing-measurements";
import {
  aggregateMeasurementsFromDrawings,
  type DrawingMeasurementSource,
} from "@/lib/building-condition/drawing-measurement-extractor";

function toSource(asset: DrawingAssetRecord): DrawingMeasurementSource {
  return {
    drawingId: asset.id,
    drawingType: asset.drawingType,
    label: `${asset.drawingType} p${asset.pageNumber}`,
    confidence: asset.confidence,
    analysis: asset.analysisResult,
  };
}

export function buildDrawingMeasurementSources(
  assets: DrawingAssetRecord[]
): DrawingMeasurementSource[] {
  return assets.map(toSource);
}

export async function extractProjectMeasurementsFromDrawings(
  projectId: string
): Promise<DrawingMeasurementExtraction> {
  const assets = await listDrawingAssetsByProject(projectId);
  return aggregateMeasurementsFromDrawings(buildDrawingMeasurementSources(assets));
}

export async function syncMeasurementsFromDrawings(
  projectId: string,
  options?: {
    drawings?: DrawingAnalysisResult[];
    drawingLabels?: string[];
    mergeOnly?: boolean;
  }
): Promise<{
  extraction: DrawingMeasurementExtraction;
  record: ProjectSiteMeasurementsDto;
}> {
  let extraction: DrawingMeasurementExtraction;

  if (options?.drawings?.length) {
    const sources: DrawingMeasurementSource[] = options.drawings.map((analysis, index) => ({
      drawingType: analysis.drawingType,
      label: options.drawingLabels?.[index] ?? `${analysis.drawingType} p${index + 1}`,
      confidence: analysis.confidence,
      analysis,
    }));
    extraction = aggregateMeasurementsFromDrawings(sources);
  } else {
    extraction = await extractProjectMeasurementsFromDrawings(projectId);
  }

  const record = await updateProjectSiteMeasurements(
    projectId,
    { measurements: extraction.measurements },
    { replace: false }
  );

  return { extraction, record };
}
