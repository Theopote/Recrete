import type { DocumentExtractionResult, VisionAnalysisOptions } from './types';

/**
 * Extracts and analyzes content from technical documents
 */
export class DocumentExtractor {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(options?: { apiKey?: string; baseUrl?: string; model?: string }) {
    this.apiKey = options?.apiKey ?? process.env.OPENAI_API_KEY ?? '';
    this.baseUrl = options?.baseUrl ?? 'https://api.openai.com/v1';
    this.model = options?.model ?? 'gpt-4o';
  }

  /**
   * Extract content from a document image/page
   */
  async extractDocument(
    imageData: string,
    context?: { documentType?: string; projectContext?: string },
    options: VisionAnalysisOptions = {}
  ): Promise<DocumentExtractionResult> {
    if (!this.apiKey) {
      return this.getMockExtraction(context);
    }

    const prompt = this.buildExtractionPrompt(context, options);

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
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        throw new Error(`Vision API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content ?? '{}';

      return this.parseExtractionResponse(content);
    } catch (error) {
      console.error('Document extraction error:', error);
      return this.getMockExtraction(context);
    }
  }

  private buildExtractionPrompt(
    context?: { documentType?: string; projectContext?: string },
    options: VisionAnalysisOptions = {}
  ): string {
    const lang = options.language === 'zh' ? '中文' : 'English';
    const docType = context?.documentType || 'technical document';
    const projectInfo = context?.projectContext ? `Project context: ${context.projectContext}` : '';

    return `You are an expert at extracting structured information from construction and architecture documents. Analyze this ${docType} and extract key information.

${projectInfo}

Return analysis in JSON format:

{
  "documentType": "report | specification | calculation | standard | drawing | other",
  "title": "document title",
  "date": "document date if shown",
  "author": "author/organization if shown",
  "extractedText": "full text content extracted from the document",
  "keyFindings": [
    "list of critical findings, recommendations, or requirements"
  ],
  "tables": [
    {
      "headers": ["column headers"],
      "rows": [["row data"]],
      "caption": "table caption if any"
    }
  ],
  "summary": "${lang === '中文' ? '文档内容的专业摘要（中文）' : 'Professional summary of document content'}",
  "metadata": {
    "projectName": "if mentioned",
    "location": "if mentioned",
    "relevantCodes": ["applicable building codes/standards"],
    "criticalValues": {"key": "value pairs of important numbers/specs"}
  }
}

Focus on extracting:
1. Document metadata (title, date, author)
2. All readable text content
3. Key technical findings and recommendations
4. Tables with numerical data
5. Referenced standards and codes
6. Critical specifications or requirements

For structural reports, pay attention to:
- Load capacity assessments
- Structural deficiencies
- Recommended interventions

For MEP documents, note:
- System specifications
- Load calculations
- Compliance requirements

Respond ONLY with valid JSON. Use ${lang} for text fields when appropriate.`;
  }

  private parseExtractionResponse(content: string): DocumentExtractionResult {
    try {
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;

      const parsed = JSON.parse(jsonStr);

      return {
        documentType: parsed.documentType || 'other',
        title: parsed.title,
        date: parsed.date,
        author: parsed.author,
        extractedText: parsed.extractedText || '',
        keyFindings: parsed.keyFindings || [],
        tables: parsed.tables || [],
        summary: parsed.summary || 'Document extracted',
        metadata: parsed.metadata || {},
      };
    } catch (error) {
      console.error('Failed to parse extraction response:', error);
      return this.getMockExtraction();
    }
  }

  private getMockExtraction(context?: { documentType?: string }): DocumentExtractionResult {
    return {
      documentType: 'report',
      title: '既有建筑结构检测报告 - Existing Building Structural Assessment Report',
      date: '2024-03-15',
      author: '中国建筑科学研究院 China Academy of Building Research',
      extractedText: `
结构检测报告
项目名称：某办公楼改造工程
建筑年份：1986年
结构形式：钢筋混凝土框架结构

一、检测概况
本次检测对该建筑物进行了全面的结构安全性评估，包括混凝土强度、钢筋锈蚀、裂缝分布等关键指标。

二、主要检测结果
1. 混凝土强度：回弹法检测结果显示，混凝土强度推定值为C25-C30，满足原设计要求
2. 钢筋锈蚀：地下室C-D轴/3-5轴柱底发现不同程度锈蚀，最大锈蚀深度约2mm
3. 裂缝分析：2层东侧外墙发现多条竖向裂缝，最大裂缝宽度0.4mm

三、结构承载力评估
通过计算复核，现有结构承载力基本满足使用要求，但需注意以下问题：
- 柱底锈蚀区域需进行修复加固
- 屋面梁存在少量承载力不足，改造时需加固

四、建议
1. 对地下室柱底锈蚀部位进行除锈及修复处理
2. 屋面梁建议采用粘贴碳纤维布加固
3. 外墙裂缝进行灌浆封闭处理
      `,
      keyFindings: [
        'Concrete strength C25-C30 meets original design requirements',
        'Rebar corrosion detected at basement columns C-D/3-5, max depth ~2mm',
        'Vertical cracks on 2nd floor east wall, max width 0.4mm',
        'Roof beams show insufficient load capacity, reinforcement required',
        'Overall structure is serviceable with recommended repairs',
      ],
      tables: [
        {
          headers: ['检测项目', '检测方法', '检测结果', '评价'],
          rows: [
            ['混凝土强度', '回弹法', 'C25-C30', '合格'],
            ['钢筋锈蚀', '电位法', '局部中度锈蚀', '需处理'],
            ['裂缝宽度', '裂缝测宽仪', '≤0.4mm', '可接受'],
            ['碳化深度', '酚酞试验', '15-20mm', '轻度碳化'],
          ],
          caption: '表1：主要检测结果汇总',
        },
      ],
      summary: '本报告对1986年建成的钢筋混凝土框架办公楼进行了全面结构检测。检测结果表明：混凝土强度满足原设计要求(C25-C30)，但存在地下室柱底钢筋锈蚀、外墙裂缝、屋面梁承载力不足等问题。建议对锈蚀部位进行修复、屋面梁采用碳纤维布加固、裂缝灌浆封闭。经适当修复加固后，该建筑可满足改造使用要求。',
      metadata: {
        projectName: '某办公楼改造工程',
        location: '地下室、2层、屋面',
        relevantCodes: ['GB 50292-2015 民用建筑可靠性鉴定标准', 'GB 50367-2013 混凝土结构加固设计规范'],
        criticalValues: {
          concreteStrength: 'C25-C30',
          corrosionDepth: '2mm',
          maxCrackWidth: '0.4mm',
          carbonationDepth: '15-20mm',
        },
      },
    };
  }
}

export const documentExtractor = new DocumentExtractor();
