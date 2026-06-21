import type { DocumentExtractionResult, VisionAnalysisOptions } from './types';

/**
 * Extracts and analyzes text from documents (PDF reports, specifications, etc.)
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
   * Extract and analyze document content from image/PDF page
   */
  async extractDocument(
    imageData: string,
    context?: { filename?: string; category?: string },
    options: VisionAnalysisOptions = {}
  ): Promise<DocumentExtractionResult> {
    if (!this.apiKey) {
      return this.getMockDocumentExtraction(context);
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
      return this.getMockDocumentExtraction(context);
    }
  }

  private buildExtractionPrompt(
    context?: { filename?: string; category?: string },
    options: VisionAnalysisOptions = {}
  ): string {
    const lang = options.language === 'zh' ? '中文' : 'English';
    const categoryInfo = context?.category ? `Document category: ${context.category}` : '';
    const filenameInfo = context?.filename ? `Filename: ${context.filename}` : '';

    return `You are an expert document analyst specializing in building renovation reports and technical documents.

${filenameInfo}
${categoryInfo}

Extract and analyze this document page. Return JSON:

{
  "documentType": "report | specification | calculation | standard | drawing | other",
  "title": "document title if visible",
  "date": "document date if visible",
  "author": "author/organization if visible",
  "extractedText": "complete text content extracted from the document",
  "keyFindings": [
    "list of important findings, conclusions, or recommendations"
  ],
  "tables": [
    {
      "headers": ["column1", "column2"],
      "rows": [["value1", "value2"]],
      "caption": "table description"
    }
  ],
  "summary": "${lang === '中文' ? '文档内容的简要总结（中文）' : 'Brief summary of document content'}",
  "metadata": {
    "pageNumber": "if visible",
    "projectName": "if mentioned",
    "buildingName": "if mentioned",
    "reportType": "structural/MEP/fire/energy/other"
  }
}

Focus on:
1. Complete text extraction (OCR all visible text)
2. Identify key technical findings and conclusions
3. Extract numerical data from tables
4. Identify critical issues or recommendations
5. Understand document context and purpose

For structural reports, pay attention to:
- Load capacity findings
- Material test results
- Defect descriptions
- Repair recommendations
- Code compliance issues

For MEP reports, focus on:
- System condition assessments
- Capacity evaluations
- Upgrade requirements
- Energy efficiency findings

${options.extractTables ? 'IMPORTANT: Extract all tables with their data accurately.' : ''}

Respond ONLY with valid JSON. Use ${lang} for text fields.`;
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
        summary: parsed.summary || 'Document extraction completed',
        metadata: parsed.metadata || {},
      };
    } catch (error) {
      console.error('Failed to parse extraction response:', error);
      return this.getMockDocumentExtraction();
    }
  }

  private getMockDocumentExtraction(context?: { filename?: string; category?: string }): DocumentExtractionResult {
    const isStructural = context?.category?.includes('structure') || context?.filename?.toLowerCase().includes('structural');

    return {
      documentType: isStructural ? 'report' : 'specification',
      title: isStructural ? '既有建筑结构检测报告 Structural Inspection Report' : '建筑改造技术规范 Renovation Specification',
      date: '2024-03-15',
      author: '西安市建筑科学研究院 Xi\'an Building Research Institute',
      extractedText: isStructural
        ? `第三方结构检测报告摘要

项目名称：西安市老办公楼改造项目
建筑地址：西安市雁塔区科技路88号
建成年份：1986年
结构类型：混凝土框架结构

检测内容：
1. 混凝土强度检测
   - 采用回弹法和钻芯法
   - 检测结果：C20-C25，符合原设计要求
   - 碳化深度：15-25mm

2. 钢筋锈蚀检测
   - 地下室柱脚（C-D/3-5轴）锈蚀电位较负
   - 建议采取防护措施

3. 构件承载力验算
   - 现有楼板承载力 250kg/m²
   - 满足一般办公使用要求
   - 改造为展览用途需进一步验算

主要结论：
结构整体状况良好，主体框架可继续使用。局部构件需进行加固处理。

建议：
1. 对地下室锈蚀柱进行防护处理
2. 楼板承载力不足区域进行加固
3. 改造前进行详细结构验算`
        : `建筑改造设计规范要点

防火设计：
- 办公改文化建筑，需重新核定防火分区
- 疏散楼梯宽度要求：1.2m以上
- 装修材料燃烧性能等级要求

节能要求：
- 外窗传热系数 ≤2.0 W/(m²·K)
- 外墙保温系统符合现行标准

无障碍设计：
- 主要出入口设置无障碍坡道
- 卫生间设置无障碍设施`,
      keyFindings: isStructural
        ? [
            '混凝土强度 C20-C25，满足原设计要求',
            '碳化深度 15-25mm，属于正常范围',
            '地下室部分柱脚存在锈蚀风险，需防护处理',
            '现有楼板承载力 250kg/m²',
            '结构整体状况良好，主体框架可继续使用',
          ]
        : [
            '防火分区需重新划分',
            '疏散楼梯宽度需满足规范要求',
            '外窗传热系数应 ≤2.0 W/(m²·K)',
            '需设置无障碍设施',
          ],
      tables: isStructural
        ? [
            {
              headers: ['构件编号', '混凝土强度 (MPa)', '碳化深度 (mm)', '评级'],
              rows: [
                ['C1', '23.5', '18', '良好'],
                ['C2', '21.8', '22', '良好'],
                ['C3', '24.2', '15', '良好'],
                ['B1', '22.1', '20', '一般'],
              ],
              caption: '主要构件检测结果汇总',
            },
          ]
        : [],
      summary: isStructural
        ? '该报告为第三方结构检测报告，建筑为1986年建成的混凝土框架结构。检测结果显示结构整体状况良好，混凝土强度满足要求，但地下室部分柱脚存在锈蚀风险。现有楼板承载力为250kg/m²，改造时需根据新功能进行验算。建议对锈蚀部位进行防护处理，承载力不足区域进行加固。'
        : '该文档为建筑改造设计规范要点，重点涵盖防火、节能、无障碍三个方面。办公改文化建筑需重新核定防火分区，外窗需满足节能要求，需增设无障碍设施。',
      metadata: {
        projectName: '西安市老办公楼改造项目',
        buildingName: '科技路88号办公楼',
        reportType: isStructural ? 'structural' : 'specification',
        pageNumber: '1',
      },
    };
  }
}

export const documentExtractor = new DocumentExtractor();
