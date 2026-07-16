import type { ProjectWithRelations, DiagnosisItem } from '@/types';
import { checkCodeCompliance, getCodesForScenario } from '../knowledge/code-database';

/**
 * Structural Engineering Expert Agent
 * 结构工程专家Agent - 提供结构安全评估和加固建议
 */
export class StructuralAgent {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(options?: { apiKey?: string; baseUrl?: string; model?: string }) {
    this.apiKey = options?.apiKey ?? process.env.OPENAI_API_KEY ?? '';
    this.baseUrl = options?.baseUrl ?? 'https://api.openai.com/v1';
    this.model = options?.model ?? 'gpt-4o-mini';
  }

  /**
   * Assess structural safety and generate recommendations
   */
  async assessStructuralSafety(project: ProjectWithRelations, context?: {
    concreteStrength?: number;
    carbonationDepth?: number;
    existingLoad?: number;
    targetLoad?: number;
  }): Promise<{
    safetyRating: 'safe' | 'acceptable' | 'marginal' | 'unsafe';
    findings: string[];
    risks: Array<{ issue: string; severity: 'low' | 'medium' | 'high' | 'critical'; recommendation: string }>;
    loadCapacityCheck?: { compliant: boolean; note: string };
    codeCompliance: Array<{ code: string; section: string; compliant: boolean; note: string }>;
    recommendations: string[];
  }> {
    const buildingAge = new Date().getFullYear() - project.constructionYear;
    const isOldBuilding = buildingAge > 30;

    // Check code compliance
    const codes = getCodesForScenario('structural_assessment');
    const codeCompliance: Array<{ code: string; section: string; compliant: boolean; note: string }> = [];

    // Check load capacity if provided
    let loadCapacityCheck;
    if (context?.existingLoad && context?.targetLoad) {
      const targetLoadKN = context.targetLoad / 100; // kg/m² to kN/m²
      const compliance = checkCodeCompliance('gb50352', '6.7.2', targetLoadKN, 
        project.targetFunction.includes('展览') || project.targetFunction.includes('exhibition') ? 'exhibition' : 'office'
      );
      
      loadCapacityCheck = {
        compliant: context.existingLoad >= context.targetLoad,
        note: context.existingLoad >= context.targetLoad
          ? `Existing capacity ${context.existingLoad} kg/m² meets target load ${context.targetLoad} kg/m²`
          : `Existing capacity ${context.existingLoad} kg/m² insufficient for target load ${context.targetLoad} kg/m². Strengthening required.`
      };
    }

    // Analyze carbonation if provided
    if (context?.carbonationDepth) {
      const coverThickness = 25; // mm, typical
      const ratio = context.carbonationDepth / coverThickness;
      const complianceResult = checkCodeCompliance('gb50763', '7.3.5', ratio, 
        ratio < 0.5 ? 'class_a' : ratio < 0.8 ? 'class_b' : ratio < 1.0 ? 'class_c' : 'class_d'
      );
      
      codeCompliance.push({
        code: 'GB 50292-2015',
        section: '7.3.5',
        compliant: ratio < 0.8,
        note: `Carbonation depth ${context.carbonationDepth}mm, ratio ${ratio.toFixed(2)} - ${
          ratio < 0.5 ? 'Class A (Safe)' :
          ratio < 0.8 ? 'Class B (Acceptable)' :
          ratio < 1.0 ? 'Class C (Marginal)' :
          'Class D (Unsafe)'
        }`
      });
    }

    // Generate findings and risks
    const findings: string[] = [];
    const risks: Array<{ issue: string; severity: 'low' | 'medium' | 'high' | 'critical'; recommendation: string }> = [];

    findings.push(`Building age: ${buildingAge} years (constructed ${project.constructionYear})`);
    findings.push(`Structure type: ${project.structureType}`);

    if (isOldBuilding) {
      findings.push(`As a ${buildingAge}-year-old building, typical age-related deterioration is expected`);
      risks.push({
        issue: 'Concrete carbonation and potential rebar corrosion',
        severity: context?.carbonationDepth && context.carbonationDepth > 20 ? 'high' : 'medium',
        recommendation: 'Conduct carbonation depth testing and rebar corrosion survey. Apply protective coating where needed.'
      });
    }

    if (context?.carbonationDepth && context.carbonationDepth > 25) {
      risks.push({
        issue: `Deep carbonation detected (${context.carbonationDepth}mm)`,
        severity: 'high',
        recommendation: 'Priority repair: Rebar may be exposed to corrosion. Apply electrochemical rehabilitation or surface protection.'
      });
    }

    if (loadCapacityCheck && !loadCapacityCheck.compliant) {
      risks.push({
        issue: 'Insufficient load capacity for target function',
        severity: 'critical',
        recommendation: 'Structural strengthening required: Consider FRP strengthening, additional columns, or load redistribution.'
      });
    }

    if (project.structureType.includes('砌体') || project.structureType.toLowerCase().includes('masonry')) {
      risks.push({
        issue: 'Masonry structure - seismic vulnerability',
        severity: 'high',
        recommendation: 'Seismic assessment required. Consider adding reinforced concrete frame or steel bracing.',
      });
    }

    if (project.structureType.toLowerCase().includes('precast') || project.structureType.includes('预制')) {
      risks.push({
        issue: 'Precast slab system — connection and bearing capacity',
        severity: 'medium',
        recommendation: 'Verify slab bearing, tie reinforcement, and capacity for new live loads before function change.',
      });
    }

    // Determine safety rating
    let safetyRating: 'safe' | 'acceptable' | 'marginal' | 'unsafe';
    const criticalRisks = risks.filter(r => r.severity === 'critical').length;
    const highRisks = risks.filter(r => r.severity === 'high').length;

    if (criticalRisks > 0) {
      safetyRating = 'unsafe';
    } else if (highRisks >= 2) {
      safetyRating = 'marginal';
    } else if (highRisks === 1 || isOldBuilding) {
      safetyRating = 'acceptable';
    } else {
      safetyRating = 'safe';
    }

    // Generate recommendations
    const recommendations: string[] = [
      'Conduct detailed structural survey including load testing and material testing',
      isOldBuilding ? 'Perform carbonation depth testing and rebar corrosion evaluation' : 'Verify concrete strength via core sampling',
      'Engage licensed structural engineer for final safety assessment',
    ];

    if (loadCapacityCheck && !loadCapacityCheck.compliant) {
      recommendations.push('Develop structural strengthening scheme with load calculation');
    }

    if (project.targetFunction !== project.currentFunction) {
      recommendations.push('Verify seismic requirements for new occupancy type');
      recommendations.push('Check foundation capacity for function change');
    }

    if (project.structureType.includes('砌体') || project.structureType.toLowerCase().includes('masonry')) {
      recommendations.push('Evaluate masonry seismic strengthening: RC shear walls, mesh mortar jacket, or external bracing.');
    }

    return {
      safetyRating,
      findings,
      risks,
      loadCapacityCheck,
      codeCompliance,
      recommendations
    };
  }

  /**
   * Generate structural diagnosis items
   */
  async generateStructuralDiagnosis(
    project: ProjectWithRelations
  ): Promise<Omit<DiagnosisItem, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>[]> {
    const buildingAge = new Date().getFullYear() - project.constructionYear;
    const diagnosis: Omit<DiagnosisItem, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>[] = [];

    // Age-based diagnosis
    if (buildingAge > 30) {
      diagnosis.push({
        title: 'Concrete carbonation assessment required',
        category: 'structure',
        severity: 'medium',
        status: 'identified',
        description: `Building age ${buildingAge} years. Carbonation depth testing recommended to evaluate rebar protection status.`,
        evidence: 'Standard practice for buildings over 30 years old',
        recommendation: 'Conduct carbonation depth testing on representative structural members. Testing frequency: 3-5 locations per floor.',
        relatedLocation: 'Primary structural members',
        requiresEngineerReview: true,
      });

      diagnosis.push({
        title: 'Rebar corrosion risk evaluation',
        category: 'structure',
        severity: buildingAge > 40 ? 'high' : 'medium',
        status: 'identified',
        description: 'Age-related corrosion assessment needed for reinforcement steel.',
        evidence: `Building constructed ${project.constructionYear}, ${buildingAge} years in service`,
        recommendation: 'Use half-cell potential mapping to identify corrosion-prone areas. Focus on basement and ground floor.',
        relatedLocation: 'Basement columns, ground floor slabs',
        requiresEngineerReview: true,
      });
    }

    // Function conversion diagnosis
    if (project.targetFunction !== project.currentFunction) {
      diagnosis.push({
        title: 'Load capacity verification for function change',
        category: 'structure',
        severity: 'high',
        status: 'identified',
        description: `Function conversion from ${project.currentFunction} to ${project.targetFunction} may require higher floor loads.`,
        evidence: 'GB 50009 requires load verification for occupancy changes',
        recommendation: 'Calculate required live load for new function. Verify existing capacity via structural analysis. Strengthen if needed.',
        relatedLocation: 'All floors',
        requiresEngineerReview: true,
      });
    }

    // Structure type specific
    if (project.structureType.includes('框架') || project.structureType.toLowerCase().includes('frame')) {
      diagnosis.push({
        title: 'Frame structure seismic performance check',
        category: 'structure',
        severity: buildingAge > 35 ? 'medium' : 'low',
        status: 'identified',
        description: 'Older frame structures may not meet current seismic code requirements.',
        evidence: `Building predates current seismic code (GB 50011-2010)`,
        recommendation: 'Perform seismic evaluation per GB 50011. Consider adding shear walls or dampers if capacity insufficient.',
        relatedLocation: 'Structural system',
        requiresEngineerReview: true,
      });
    }

    return diagnosis;
  }

  /**
   * Suggest strengthening methods for common and complex renovation scenarios.
   */
  suggestStrengtheningMethods(
    issue:
      | "insufficient_capacity"
      | "corrosion"
      | "seismic"
      | "crack"
      | "masonry_seismic"
      | "settlement"
      | "joint_strengthening"
      | "precast_slab"
      | "timber_protection"
  ): Array<{ method: string; pros: string[]; cons: string[]; costLevel: "low" | "medium" | "high" }> {
    const methods: Record<
      Parameters<StructuralAgent["suggestStrengtheningMethods"]>[0],
      Array<{ method: string; pros: string[]; cons: string[]; costLevel: "low" | "medium" | "high" }>
    > = {
      insufficient_capacity: [
        {
          method: 'FRP (Fiber Reinforced Polymer) wrapping',
          pros: ['Minimal thickness increase', 'Fast construction', 'Corrosion resistant'],
          cons: ['Higher material cost', 'Requires skilled labor', 'Fire protection needed'],
          costLevel: 'high' as const
        },
        {
          method: 'Concrete jacketing',
          pros: ['Cost effective', 'Proven technology', 'Increases fire resistance'],
          cons: ['Reduces clear space', 'Longer construction time', 'Additional dead load'],
          costLevel: 'medium' as const
        },
        {
          method: 'Steel plate bonding',
          pros: ['High strength gain', 'Relatively quick', 'Minimal space loss'],
          cons: ['Corrosion protection needed', 'Welding required', 'Fire protection needed'],
          costLevel: 'medium' as const
        },
      ],
      corrosion: [
        {
          method: 'Electrochemical chloride extraction',
          pros: ['Non-destructive', 'Treats large areas', 'Long-term protection'],
          cons: ['Expensive', 'Specialized equipment', 'Time consuming'],
          costLevel: 'high' as const
        },
        {
          method: 'Repair mortar with corrosion inhibitor',
          pros: ['Cost effective', 'Standard technology', 'Aesthetic repair'],
          cons: ['Requires concrete removal', 'May not stop corrosion', 'Recurring maintenance'],
          costLevel: 'low' as const
        },
      ],
      seismic: [
        {
          method: 'RC shear wall addition',
          pros: ['Significant stiffness increase', 'Proven seismic solution', 'Durable'],
          cons: ['Major intervention', 'Reduces usable space', 'High cost'],
          costLevel: 'high' as const
        },
        {
          method: 'Steel bracing system',
          pros: ['Effective and efficient', 'Can be exposed as design feature', 'Faster construction'],
          cons: ['Visible intervention', 'Connection detailing critical', 'Moderate cost'],
          costLevel: 'medium' as const
        },
      ],
      crack: [
        {
          method: 'Epoxy injection',
          pros: ['Restores tensile strength', 'Waterproofs crack', 'Minimal visual impact'],
          cons: ['Only for inactive cracks', 'May fail if movement continues', 'Skilled labor required'],
          costLevel: 'low' as const
        },
        {
          method: 'Flexible sealant (for active cracks)',
          pros: ['Accommodates movement', 'Easy application', 'Cost effective'],
          cons: ['Does not restore strength', 'Requires monitoring', 'Aesthetic impact'],
          costLevel: 'low' as const
        },
      ],
      masonry_seismic: [
        {
          method: '增设钢筋混凝土抗震墙 / RC shear wall addition',
          pros: ['大幅提升抗侧刚度', '适用于砌体结构', '技术成熟'],
          cons: ['占用使用面积', '需基础承载力复核', '施工干扰大'],
          costLevel: 'high' as const,
        },
        {
          method: '外包型钢构抗震加固 / External steel bracing',
          pros: ['加固速度快', '对室内影响较小', '可部分外露为设计元素'],
          cons: ['需防腐防火处理', '节点设计复杂', '外观干预明显'],
          costLevel: 'medium' as const,
        },
        {
          method: '面层钢筋网砂浆加固 / Mesh-reinforced mortar jacket',
          pros: ['适合砌体墙面', '造价相对较低', '可局部实施'],
          cons: ['增厚墙体', '需与原砌体可靠锚固', '耐久性依赖施工质量'],
          costLevel: 'medium' as const,
        },
      ],
      settlement: [
        {
          method: '注浆抬升 / Grouting and jacking',
          pros: ['可控制抬升量', '对上部结构干扰小', '适合不均匀沉降'],
          cons: ['需持续监测', '地质条件限制大', '专业队伍要求高'],
          costLevel: 'high' as const,
        },
        {
          method: '基础扩大与托换 / Foundation underpinning',
          pros: ['从根本上提高承载', '适用于功能加重', '长期可靠'],
          cons: ['造价高', '工期长', '需降水与支护'],
          costLevel: 'high' as const,
        },
        {
          method: '沉降缝与结构释放 / Differential settlement relief',
          pros: ['减缓次生裂缝', '可结合功能重组', '实施灵活'],
          cons: ['不提高承载力', '需防水处理', '需结构工程师复核'],
          costLevel: 'low' as const,
        },
      ],
      joint_strengthening: [
        {
          method: '梁柱节点外包钢板 / Steel jacket at beam-column joint',
          pros: ['显著提高节点抗剪能力', '施工相对可控', '适合框架节点薄弱'],
          cons: ['防火防腐要求高', '减少净高', '需精确放样'],
          costLevel: 'medium' as const,
        },
        {
          method: '节点增大截面 / Enlarged joint with high-strength concrete',
          pros: ['整体性好', '耐火性能佳', '规范认可度高'],
          cons: ['模板支护复杂', '增加自重', '占用空间'],
          costLevel: 'medium' as const,
        },
        {
          method: '体外预应力加固 / External post-tensioning',
          pros: ['高效提升承载', '可主动改善挠度', '对使用影响小'],
          cons: ['锚固区设计关键', '需长期监测', '造价较高'],
          costLevel: 'high' as const,
        },
      ],
      precast_slab: [
        {
          method: '预制板现浇叠合层 / Cast-in-place topping slab',
          pros: ['形成整体楼板', '可提高承载与刚度', '适合功能加重'],
          cons: ['增加楼面荷载', '需板端锚固', '湿作业量大'],
          costLevel: 'medium' as const,
        },
        {
          method: '板底粘钢或碳纤维加固 / Soffit steel/CFRP strengthening',
          pros: ['不改室内净高', '施工速度快', '适合局部承载不足'],
          cons: ['防火处理必须', '对潮湿环境敏感', '需封闭裂缝先行'],
          costLevel: 'medium' as const,
        },
        {
          method: '增设钢梁支承 / Supplementary steel beams under precast units',
          pros: ['直接分担荷载', '可结合设备管线整合', '可分期实施'],
          cons: ['降低净高', '需柱网协调', '外观需处理'],
          costLevel: 'medium' as const,
        },
      ],
      timber_protection: [
        {
          method: '可逆性支撑加固 / Reversible timber propping and bracing',
          pros: ['符合文物保护原则', '可拆卸', '对原构件损伤小'],
          cons: ['承载提升有限', '需定期维护', '不适合大跨度加重'],
          costLevel: 'low' as const,
        },
        {
          method: '隐蔽钢构件加固 / Concealed steel reinforcement',
          pros: ['兼顾承载与外观', '可控制变形', '便于监测'],
          cons: ['需专家论证', '施工精度高', '造价偏高'],
          costLevel: 'high' as const,
        },
        {
          method: '防腐防虫处理 / Conservation treatment (pest & moisture)',
          pros: ['延长木构件寿命', '风险低', '可与其他修缮同步'],
          cons: ['不解决结构不足', '需反复维护', '材料兼容性需评估'],
          costLevel: 'low' as const,
        },
      ],
    };

    return methods[issue] ?? [];
  }
}

export const structuralAgent = new StructuralAgent();

export async function assessStructuralSafety(
  project: ProjectWithRelations,
  context?: Parameters<StructuralAgent['assessStructuralSafety']>[1]
) {
  return structuralAgent.assessStructuralSafety(project, context);
}

export async function generateStructuralDiagnosis(project: ProjectWithRelations) {
  return structuralAgent.generateStructuralDiagnosis(project);
}

export function suggestStrengtheningMethods(
  issue: Parameters<StructuralAgent['suggestStrengtheningMethods']>[0]
) {
  return structuralAgent.suggestStrengtheningMethods(issue);
}
