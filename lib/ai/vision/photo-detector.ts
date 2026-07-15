import { VisionProvider, parseVisionJson } from "./vision-provider";
import { useVisionMockFallback, rethrowVisionError } from "./vision-mode";
import { normalizeBilingualText } from "@/lib/ai/knowledge/term-dictionary";
import type {
  DamageMetrics,
  DetectedDefect,
  PhotoCategory,
  PhotoDefectAnalysisResult,
  VisionAnalysisOptions,
} from "./types";

/**
 * Analyzes site photos for defects, classification, and quantified damage assessment
 */
export class PhotoDefectDetector {
  private vision: VisionProvider;

  constructor(options?: { provider?: "openai" | "anthropic"; apiKey?: string; model?: string }) {
    this.vision = new VisionProvider(options);
  }

  async analyzePhoto(
    imageData: string,
    context?: { location?: string; buildingAge?: number },
    options: VisionAnalysisOptions = {}
  ): Promise<PhotoDefectAnalysisResult> {
    if (!this.vision.isConfigured) {
      return this.getMockDefectAnalysis(context);
    }

    const prompt = this.buildDefectPrompt(context, options);

    try {
      const content = await this.vision.analyzeImage({
        prompt,
        imageData,
        detail: options.detail ?? "high",
        maxTokens: 3000,
        temperature: 0.2,
      });
      const parsed = this.parseDefectResponse(content);
      return this.enrichWithMetrics(parsed);
    } catch (error) {
      console.error("Photo analysis error:", error);
      if (!useVisionMockFallback()) rethrowVisionError(error);
      return this.getMockDefectAnalysis(context);
    }
  }

  async analyzePhotoBatch(
    images: { data: string; location?: string }[],
    options: VisionAnalysisOptions = {}
  ): Promise<PhotoDefectAnalysisResult[]> {
    return Promise.all(
      images.map((img) => this.analyzePhoto(img.data, { location: img.location }, options))
    );
  }

  get modelName(): string {
    return this.vision.modelName;
  }

  private buildDefectPrompt(
    context?: { location?: string; buildingAge?: number },
    options: VisionAnalysisOptions = {}
  ): string {
    const lang = options.language === "zh" ? "中文" : "English";
    const locationInfo = context?.location ? `Location: ${context.location}` : "";
    const ageInfo = context?.buildingAge ? `Building age: ~${context.buildingAge} years` : "";

    return `You are an expert building condition assessor. Analyze this site photo.

${locationInfo}
${ageInfo}

Return JSON:

{
  "photoCategory": "structure | facade | mep | interior | site | unknown",
  "defects": [
    {
      "type": "crack | spalling | corrosion | leakage | deformation | deterioration | other",
      "severity": "low | medium | high | critical",
      "location": {"x": 0, "y": 0, "width": 100, "height": 100},
      "description": "detailed description",
      "suggestedAction": "recommended remedial action",
      "confidence": 0.0-1.0,
      "quantified": {
        "widthMm": "estimated crack width in mm if applicable",
        "lengthMm": "estimated length in mm",
        "areaSqm": "estimated affected area in sqm",
        "depthMm": "estimated depth in mm"
      }
    }
  ],
  "overallCondition": "good | fair | poor | critical",
  "recommendations": ["prioritized recommendations"],
  "confidence": 0.0-1.0,
  "summary": "${lang === "中文" ? "现场状况的简要总结（中文）" : "Brief summary of site condition"}"
}

Classify photo as: structure (结构), facade (外立面), mep (机电), interior (室内), or site (场地).
Quantify damage where possible: crack width (mm), affected area (sqm), corrosion extent.

Respond ONLY with valid JSON. Use ${lang} for text fields.`;
  }

  private parseDefectResponse(content: string): PhotoDefectAnalysisResult {
    const parsed = parseVisionJson<
      Partial<PhotoDefectAnalysisResult> & { defects?: DetectedDefect[] }
    >(content, {});

    const base: PhotoDefectAnalysisResult = {
      photoCategory: parsed.photoCategory || "unknown",
      defects: parsed.defects || [],
      overallCondition: parsed.overallCondition || "fair",
      severityScore: 50,
      damageMetrics: {
        overallScore: 50,
        crackCount: 0,
      },
      recommendations: parsed.recommendations || [],
      confidence: parsed.confidence || 0.7,
      summary: normalizeBilingualText(parsed.summary || "Photo analysis completed"),
    };

    return this.enrichWithMetrics(base);
  }

  private enrichWithMetrics(result: PhotoDefectAnalysisResult): PhotoDefectAnalysisResult {
    const metrics = computeDamageMetrics(result.defects, result.overallCondition);
    return {
      ...result,
      severityScore: metrics.overallScore,
      damageMetrics: metrics,
      summary: normalizeBilingualText(result.summary),
    };
  }

  private getMockDefectAnalysis(context?: {
    location?: string;
    buildingAge?: number;
  }): PhotoDefectAnalysisResult {
    const age = context?.buildingAge || 35;
    const location = context?.location || "Facade";

    const defects: DetectedDefect[] = [
      {
        type: "crack",
        severity: age > 30 ? "medium" : "low",
        location: { x: 120, y: 200, width: 80, height: 150 },
        description: `Vertical crack in concrete ${location.toLowerCase()}, ~0.3mm width, ~1.5m length.`,
        suggestedAction: "Monitor crack width. Apply epoxy injection if stable.",
        confidence: 0.85,
        quantified: { widthMm: 0.3, lengthMm: 1500 },
      },
      {
        type: "spalling",
        severity: "high",
        location: { x: 300, y: 180, width: 60, height: 80 },
        description: "Concrete spalling with exposed rebar. Delamination area ~0.5 sqm.",
        suggestedAction: "Priority repair: remove loose concrete, treat corrosion, apply repair mortar.",
        confidence: 0.92,
        quantified: { areaSqm: 0.5, depthMm: 25 },
      },
      {
        type: "leakage",
        severity: "medium",
        location: { x: 450, y: 100, width: 100, height: 120 },
        description: "Water stains and efflorescence indicating water infiltration.",
        suggestedAction: "Investigate water source and repair waterproofing.",
        confidence: 0.78,
        quantified: { areaSqm: 0.3 },
      },
    ];

    const result: PhotoDefectAnalysisResult = {
      photoCategory: location.toLowerCase().includes("mep") ? "mep" : "facade",
      defects,
      overallCondition: age > 35 ? "poor" : "fair",
      severityScore: 0,
      damageMetrics: { overallScore: 0, crackCount: 0 },
      recommendations: [
        "Conduct detailed structural survey focusing on spalling areas",
        "Prioritize spalling repair to prevent further corrosion",
        "Investigate and fix water infiltration sources",
        "Monitor crack propagation over 6-month period",
      ],
      confidence: 0.84,
      summary: normalizeBilingualText(
        `现场照片显示混凝土开裂 (Crack)、剥落 (Spalling) 及渗水 (Leakage) 痕迹。建筑年龄约${age}年，剥落露筋问题需优先处理。`
      ),
    };

    return this.enrichWithMetrics(result);
  }
}

function computeDamageMetrics(
  defects: DetectedDefect[],
  overallCondition: PhotoDefectAnalysisResult["overallCondition"]
): DamageMetrics {
  const severityWeights = { low: 10, medium: 25, high: 45, critical: 70 };
  let score = 0;
  let maxCrackWidth: number | undefined;
  let affectedArea = 0;
  let corrosionLevel: DamageMetrics["corrosionLevel"] = "none";
  const crackCount = defects.filter((d) => d.type === "crack").length;

  for (const defect of defects) {
    score += severityWeights[defect.severity] ?? 10;
    if (defect.quantified?.widthMm) {
      maxCrackWidth = Math.max(maxCrackWidth ?? 0, defect.quantified.widthMm);
    }
    if (defect.quantified?.areaSqm) {
      affectedArea += defect.quantified.areaSqm;
    }
    if (defect.type === "corrosion" || defect.description.toLowerCase().includes("rust")) {
      corrosionLevel =
        defect.severity === "critical" || defect.severity === "high"
          ? "severe"
          : defect.severity === "medium"
            ? "moderate"
            : "surface";
    }
  }

  const conditionBase = { good: 5, fair: 20, poor: 45, critical: 75 };
  const overallScore = Math.min(
    100,
    Math.round((score + conditionBase[overallCondition]) / Math.max(defects.length, 1))
  );

  return {
    overallScore,
    crackCount,
    maxCrackWidthMm: maxCrackWidth,
    affectedAreaSqm: affectedArea > 0 ? Math.round(affectedArea * 100) / 100 : undefined,
    corrosionLevel,
  };
}

export const photoDefectDetector = new PhotoDefectDetector();
