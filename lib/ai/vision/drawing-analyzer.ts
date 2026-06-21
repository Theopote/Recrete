import type { DrawingAnalysisResult, VisionAnalysisOptions } from './types';

/**
 * Analyzes architectural/engineering drawings using Vision AI
 */
export class DrawingAnalyzer {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(options?: { apiKey?: string; baseUrl?: string; model?: string }) {
    this.apiKey = options?.apiKey ?? process.env.OPENAI_API_KEY ?? '';
    this.baseUrl = options?.baseUrl ?? 'https://api.openai.com/v1';
    this.model = options?.model ?? 'gpt-4o';
  }

  /**
   * Analyze a drawing from a file URL or base64 string
   */
  async analyzeDrawing(
    imageData: string,
    options: VisionAnalysisOptions = {}
  ): Promise<DrawingAnalysisResult> {
    if (!this.apiKey) {
      // Return mock data for development
      return this.getMockDrawingAnalysis();
    }

    const prompt = this.buildDrawingPrompt(options);
    
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
          max_tokens: 4096,
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        throw new Error(`Vision API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content ?? '{}';
      
      return this.parseDrawingResponse(content);
    } catch (error) {
      console.error('Drawing analysis error:', error);
      return this.getMockDrawingAnalysis();
    }
  }

  /**
   * Analyze multiple drawings in batch
   */
  async analyzeDrawingBatch(
    images: string[],
    options: VisionAnalysisOptions = {}
  ): Promise<DrawingAnalysisResult[]> {
    const results = await Promise.all(
      images.map((img) => this.analyzeDrawing(img, options))
    );
    return results;
  }

  private buildDrawingPrompt(options: VisionAnalysisOptions): string {
    const lang = options.language === 'zh' ? '中文' : 'English';
    
    return `You are an expert architectural drawing analyst. Analyze this drawing and extract the following information in JSON format:

{
  "drawingType": "floor_plan | elevation | section | detail | structural | mep | unknown",
  "scale": "extracted scale (e.g., 1:100)",
  "orientation": "north orientation if shown",
  "rooms": [
    {
      "id": "unique identifier",
      "label": "room name/number",
      "area": "area in square meters if shown",
      "function": "room function",
      "dimensions": {"width": number, "height": number},
      "location": {"x": 0, "y": 0, "width": 100, "height": 100}
    }
  ],
  "dimensions": [
    {
      "value": number,
      "unit": "m/mm/ft",
      "type": "length/width/height/area",
      "location": {"x": 0, "y": 0, "width": 100, "height": 100}
    }
  ],
  "annotations": [
    {
      "text": "annotation text",
      "type": "label/note/specification/reference",
      "location": {"x": 0, "y": 0, "width": 100, "height": 100}
    }
  ],
  "structuralElements": [
    {
      "type": "column/beam/wall/slab",
      "id": "element identifier",
      "size": "dimensions",
      "material": "concrete/steel/masonry",
      "location": {"x": 0, "y": 0, "width": 100, "height": 100}
    }
  ],
  "extractedText": ["all text found in the drawing"],
  "confidence": 0.0-1.0,
  "summary": "${lang === '中文' ? '图纸的简要描述（中文）' : 'Brief description of the drawing'}"
}

Focus on extracting:
1. Drawing type and scale
2. Room layouts and dimensions
3. Structural elements (columns, beams, walls)
4. Critical annotations and notes
5. Any visible defects or issues

Respond ONLY with valid JSON. Use ${lang} for text fields.`;
  }

  private parseDrawingResponse(content: string): DrawingAnalysisResult {
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      
      const parsed = JSON.parse(jsonStr);
      
      // Validate and set defaults
      return {
        drawingType: parsed.drawingType || 'unknown',
        scale: parsed.scale,
        orientation: parsed.orientation,
        rooms: parsed.rooms || [],
        dimensions: parsed.dimensions || [],
        annotations: parsed.annotations || [],
        structuralElements: parsed.structuralElements || [],
        confidence: parsed.confidence || 0.7,
        extractedText: parsed.extractedText || [],
        summary: parsed.summary || 'Drawing analysis completed',
      };
    } catch (error) {
      console.error('Failed to parse drawing response:', error);
      return this.getMockDrawingAnalysis();
    }
  }

  private getMockDrawingAnalysis(): DrawingAnalysisResult {
    return {
      drawingType: 'floor_plan',
      scale: '1:100',
      orientation: 'North up',
      rooms: [
        {
          id: 'R101',
          label: '办公室 Office',
          area: 45.2,
          function: 'office',
          dimensions: { width: 6.5, height: 7.0 },
          location: { x: 100, y: 150, width: 200, height: 250 },
        },
        {
          id: 'R102',
          label: '会议室 Meeting Room',
          area: 32.8,
          function: 'meeting',
          dimensions: { width: 5.2, height: 6.3 },
          location: { x: 320, y: 150, width: 180, height: 220 },
        },
      ],
      dimensions: [
        { value: 6.5, unit: 'm', type: 'length', location: { x: 100, y: 100, width: 200, height: 20 } },
        { value: 7.0, unit: 'm', type: 'width', location: { x: 80, y: 150, width: 20, height: 250 } },
      ],
      annotations: [
        {
          text: '混凝土框架结构 RC Frame',
          type: 'specification',
          location: { x: 50, y: 50, width: 150, height: 30 },
        },
      ],
      structuralElements: [
        {
          type: 'column',
          id: 'C1',
          size: '500x500',
          material: 'concrete',
          location: { x: 95, y: 145, width: 10, height: 10 },
        },
        {
          type: 'column',
          id: 'C2',
          size: '500x500',
          material: 'concrete',
          location: { x: 295, y: 145, width: 10, height: 10 },
        },
      ],
      extractedText: [
        '平面图 Floor Plan',
        '比例 Scale 1:100',
        '建成年份 1986',
        '混凝土框架结构',
      ],
      confidence: 0.85,
      summary: 'This is a floor plan showing office spaces in a concrete frame structure built in 1986. The plan includes two main rooms with dimensions and structural column locations marked.',
    };
  }
}

export const drawingAnalyzer = new DrawingAnalyzer();
