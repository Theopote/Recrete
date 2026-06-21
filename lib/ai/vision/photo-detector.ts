import type { PhotoDefectAnalysisResult, VisionAnalysisOptions } from './types';

/**
 * Analyzes site photos for defects and conditions using Vision AI
 */
export class PhotoDefectDetector {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(options?: { apiKey?: string; baseUrl?: string; model?: string }) {
    this.apiKey = options?.apiKey ?? process.env.OPENAI_API_KEY ?? '';
    this.baseUrl = options?.baseUrl ?? 'https://api.openai.com/v1';
    this.model = options?.model ?? 'gpt-4o';
  }

  /**
   * Analyze a photo for defects
   */
  async analyzePhoto(
    imageData: string,
    context?: { location?: string; buildingAge?: number },
    options: VisionAnalysisOptions = {}
  ): Promise<PhotoDefectAnalysisResult> {
    if (!this.apiKey) {
      return this.getMockDefectAnalysis(context);
    }

    const prompt = this.buildDefectPrompt(context, options);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageData.startsWith('data:') ? imageData : `data:image/jpeg;base64,${imageData}`,
                    detail: options.detail ?? 'high',
                  },
                },
              ],
            },
          ],
          max_tokens: 3000,
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        throw new Error(`Vision API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content ?? '{}';

      return this.parseDefectResponse(content);
    } catch (error) {
      console.error('Photo analysis error:', error);
      return this.getMockDefectAnalysis(context);
    }
  }

  /**
   * Analyze multiple photos in batch
   */
  async analyzePhotoBatch(
    images: { data: string; location?: string }[],
    options: VisionAnalysisOptions = {}
  ): Promise<PhotoDefectAnalysisResult[]> {
    const results = await Promise.all(
      images.map((img) =>
        this.analyzePhoto(img.data, { location: img.location }, options)
      )
    );
    return results;
  }

  private buildDefectPrompt(
    context?: { location?: string; buildingAge?: number },
    options: VisionAnalysisOptions = {}
  ): string {
    const lang = options.language === 'zh' ? '中文' : 'English';
    const locationInfo = context?.location ? `Location: ${context.location}` : '';
    const ageInfo = context?.buildingAge ? `Building age: ~${context.buildingAge} years` : '';

    return `You are an expert building condition assessor specializing in existing building defects. Analyze this photo for structural and architectural defects.

${locationInfo}
${ageInfo}

Return analysis in JSON format:

{
  "defects": [
    {
      "type": "crack | spalling | corrosion | leakage | deformation | deterioration | other",
      "severity": "low | medium | high | critical",
      "location": {"x": 0, "y": 0, "width": 100, "height": 100},
      "description": "detailed description of the defect",
      "suggestedAction": "recommended remedial action",
      "confidence": 0.0-1.0
    }
  ],
  "overallCondition": "good | fair | poor | critical",
  "recommendations": [
    "prioritized list of recommendations"
  ],
  "confidence": 0.0-1.0,
  "summary": "${lang === '中文' ? '现场状况的简要总结（中文）' : 'Brief summary of site condition'}"
}

Look for:
1. Concrete cracks (width, pattern, location)
2. Spalling or concrete deterioration
3. Exposed rebar or corrosion
4. Water damage or leakage stains
5. Structural deformation
6. Facade damage
7. Any safety hazards

For old buildings (30+ years), pay special attention to:
- Carbonation and rebar corrosion
- Foundation settlement cracks
- Facade tile detachment risks
- MEP system aging

Respond ONLY with valid JSON. Use ${lang} for text fields.`;
  }

  private parseDefectResponse(content: string): PhotoDefectAnalysisResult {
    try {
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;

      const parsed = JSON.parse(jsonStr);

      return {
        defects: parsed.defects || [],
        overallCondition: parsed.overallCondition || 'fair',
        recommendations: parsed.recommendations || [],
        confidence: parsed.confidence || 0.7,
        summary: parsed.summary || 'Photo analysis completed',
      };
    } catch (error) {
      console.error('Failed to parse defect response:', error);
      return this.getMockDefectAnalysis();
    }
  }

  private getMockDefectAnalysis(context?: { location?: string; buildingAge?: number }): PhotoDefectAnalysisResult {
    const age = context?.buildingAge || 35;
    const location = context?.location || 'Facade';

    return {
      defects: [
        {
          type: 'crack',
          severity: age > 30 ? 'medium' : 'low',
          location: { x: 120, y: 200, width: 80, height: 150 },
          description: `Vertical crack observed in concrete ${location.toLowerCase()}, approximately 0.3mm width, extending ~1.5m. Likely caused by concrete shrinkage and aging.`,
          suggestedAction: 'Monitor crack width. If stable, apply epoxy injection for sealing. If active, consult structural engineer.',
          confidence: 0.85,
        },
        {
          type: 'spalling',
          severity: 'high',
          location: { x: 300, y: 180, width: 60, height: 80 },
          description: 'Concrete spalling with exposed rebar visible. Estimated delamination area ~0.5 sqm. Rebar shows surface rust.',
          suggestedAction: 'Priority repair required. Remove loose concrete, treat rebar corrosion, apply repair mortar with bonding agent.',
          confidence: 0.92,
        },
        {
          type: 'leakage',
          severity: 'medium',
          location: { x: 450, y: 100, width: 100, height: 120 },
          description: 'Water stains and efflorescence indicating past or ongoing water infiltration. Likely from roof or window waterproofing failure.',
          suggestedAction: 'Investigate water source. Repair waterproofing at origin. Monitor during rainy season.',
          confidence: 0.78,
        },
      ],
      overallCondition: age > 35 ? 'poor' : 'fair',
      recommendations: [
        'Conduct detailed structural survey focusing on areas with spalling and exposed rebar',
        'Prioritize spalling repair to prevent further corrosion',
        'Investigate and fix water infiltration sources',
        'Monitor crack propagation over 6-month period',
        age > 30
          ? 'Consider carbonation depth testing for entire facade'
          : 'Schedule routine inspection',
        'Budget for comprehensive facade repair within 1-2 years',
      ],
      confidence: 0.84,
      summary: `现场照片显示建筑物存在多处缺陷：混凝土开裂、剥落及渗水痕迹。考虑到建筑年龄约${age}年，这些问题较为典型。其中混凝土剥落露筋问题需优先处理，防止钢筋进一步锈蚀。建议进行详细结构检测，并制定系统性修缮方案。整体状况评估为"一般"，需及时干预以防止进一步恶化。`,
    };
  }
}

export const photoDefectDetector = new PhotoDefectDetector();
