import type { ProjectWithRelations, DiagnosisItem } from '@/types';
import { checkCodeCompliance, getCodesForScenario } from '../knowledge/code-database';
import { bi, type BilingualString } from '@/lib/i18n/bilingual';

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
    findings: BilingualString[];
    risks: Array<{
      issue: BilingualString;
      severity: 'low' | 'medium' | 'high' | 'critical';
      recommendation: BilingualString;
    }>;
    loadCapacityCheck?: { compliant: boolean; note: BilingualString };
    codeCompliance: Array<{ code: string; section: string; compliant: boolean; note: string }>;
    recommendations: BilingualString[];
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
          ? bi(
              `Existing capacity ${context.existingLoad} kg/m² meets target load ${context.targetLoad} kg/m²`,
              `现有承载力 ${context.existingLoad} kg/m² 满足目标荷载 ${context.targetLoad} kg/m²`
            )
          : bi(
              `Existing capacity ${context.existingLoad} kg/m² insufficient for target load ${context.targetLoad} kg/m². Strengthening required.`,
              `现有承载力 ${context.existingLoad} kg/m² 不足目标荷载 ${context.targetLoad} kg/m²，需结构加固。`
            ),
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
    const findings: BilingualString[] = [];
    const risks: Array<{
      issue: BilingualString;
      severity: 'low' | 'medium' | 'high' | 'critical';
      recommendation: BilingualString;
    }> = [];

    findings.push(
      bi(
        `Building age: ${buildingAge} years (constructed ${project.constructionYear})`,
        `建筑建造 ${buildingAge} 年（建于 ${project.constructionYear} 年）`
      )
    );
    findings.push(
      bi(`Structure type: ${project.structureType}`, `结构类型：${project.structureType}`)
    );

    if (isOldBuilding) {
      findings.push(
        bi(
          `As a ${buildingAge}-year-old building, typical age-related deterioration is expected`,
          `建筑已使用 ${buildingAge} 年，存在典型的龄期性劣化风险`
        )
      );
      risks.push({
        issue: bi('Concrete carbonation and potential rebar corrosion', '混凝土碳化及钢筋锈蚀风险'),
        severity: context?.carbonationDepth && context.carbonationDepth > 20 ? 'high' : 'medium',
        recommendation: bi(
          'Conduct carbonation depth testing and rebar corrosion survey. Apply protective coating where needed.',
          '开展碳化深度检测与钢筋锈蚀调查，必要时采取防护涂层。'
        ),
      });
    }

    if (context?.carbonationDepth && context.carbonationDepth > 25) {
      risks.push({
        issue: bi(
          `Deep carbonation detected (${context.carbonationDepth}mm)`,
          `检测到深度碳化（${context.carbonationDepth}mm）`
        ),
        severity: 'high',
        recommendation: bi(
          'Priority repair: Rebar may be exposed to corrosion. Apply electrochemical rehabilitation or surface protection.',
          '优先修缮：钢筋可能已暴露于腐蚀环境，建议电化学修复或表面防护。'
        ),
      });
    }

    if (loadCapacityCheck && !loadCapacityCheck.compliant) {
      risks.push({
        issue: bi('Insufficient load capacity for target function', '目标功能承载力不足'),
        severity: 'critical',
        recommendation: bi(
          'Structural strengthening required: Consider FRP strengthening, additional columns, or load redistribution.',
          '需结构加固：可考虑碳纤维加固、增设柱或荷载重分布。'
        ),
      });
    }

    if (project.structureType.includes('砌体') || project.structureType.toLowerCase().includes('masonry')) {
      risks.push({
        issue: bi('Masonry structure - seismic vulnerability', '砌体结构抗震薄弱'),
        severity: 'high',
        recommendation: bi(
          'Seismic assessment required. Consider adding reinforced concrete frame or steel bracing.',
          '须开展抗震评估，可考虑增设钢筋混凝土框架或钢支撑。'
        ),
      });
    }

    if (project.structureType.toLowerCase().includes('precast') || project.structureType.includes('预制')) {
      risks.push({
        issue: bi('Precast slab system — connection and bearing capacity', '预制板体系连接与承载问题'),
        severity: 'medium',
        recommendation: bi(
          'Verify slab bearing, tie reinforcement, and capacity for new live loads before function change.',
          '功能变更前须核实板端支承、拉结钢筋及新活荷载下的承载能力。'
        ),
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
    const recommendations: BilingualString[] = [
      bi(
        'Conduct detailed structural survey including load testing and material testing',
        '开展详细结构勘察，含荷载试验与材料检测'
      ),
      isOldBuilding
        ? bi(
            'Perform carbonation depth testing and rebar corrosion evaluation',
            '开展碳化深度检测与钢筋锈蚀评估'
          )
        : bi('Verify concrete strength via core sampling', '通过钻芯取样核实混凝土强度'),
      bi(
        'Engage licensed structural engineer for final safety assessment',
        '委托注册结构工程师完成最终安全评估'
      ),
    ];

    if (loadCapacityCheck && !loadCapacityCheck.compliant) {
      recommendations.push(
        bi('Develop structural strengthening scheme with load calculation', '编制含荷载计算的结构加固方案')
      );
    }

    if (project.targetFunction !== project.currentFunction) {
      recommendations.push(
        bi('Verify seismic requirements for new occupancy type', '核实新使用功能的抗震要求'),
        bi('Check foundation capacity for function change', '复核功能变更后的地基承载力')
      );
    }

    if (project.structureType.includes('砌体') || project.structureType.toLowerCase().includes('masonry')) {
      recommendations.push(
        bi(
          'Evaluate masonry seismic strengthening: RC shear walls, mesh mortar jacket, or external bracing.',
          '评估砌体抗震加固方案：钢筋混凝土抗震墙、钢筋网砂浆面层或外包钢支撑。'
        )
      );
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
  ): Array<{
    method: BilingualString;
    pros: BilingualString[];
    cons: BilingualString[];
    costLevel: "low" | "medium" | "high";
  }> {
    const methods: Record<
      Parameters<StructuralAgent["suggestStrengtheningMethods"]>[0],
      Array<{
        method: BilingualString;
        pros: BilingualString[];
        cons: BilingualString[];
        costLevel: "low" | "medium" | "high";
      }>
    > = {
      insufficient_capacity: [
        {
          method: bi("FRP (Fiber Reinforced Polymer) wrapping", "碳纤维（FRP）包裹加固"),
          pros: [
            bi("Minimal thickness increase", "增厚量小"),
            bi("Fast construction", "施工速度快"),
            bi("Corrosion resistant", "耐腐蚀"),
          ],
          cons: [
            bi("Higher material cost", "材料成本较高"),
            bi("Requires skilled labor", "需熟练技工"),
            bi("Fire protection needed", "须做防火处理"),
          ],
          costLevel: "high" as const,
        },
        {
          method: bi("Concrete jacketing", "增大截面外包混凝土"),
          pros: [
            bi("Cost effective", "造价经济"),
            bi("Proven technology", "技术成熟"),
            bi("Increases fire resistance", "耐火性能提升"),
          ],
          cons: [
            bi("Reduces clear space", "占用净空"),
            bi("Longer construction time", "工期较长"),
            bi("Additional dead load", "增加自重"),
          ],
          costLevel: "medium" as const,
        },
        {
          method: bi("Steel plate bonding", "粘钢加固"),
          pros: [
            bi("High strength gain", "强度提升显著"),
            bi("Relatively quick", "施工较快"),
            bi("Minimal space loss", "空间损失小"),
          ],
          cons: [
            bi("Corrosion protection needed", "须防腐处理"),
            bi("Welding required", "需焊接作业"),
            bi("Fire protection needed", "须做防火处理"),
          ],
          costLevel: "medium" as const,
        },
      ],
      corrosion: [
        {
          method: bi("Electrochemical chloride extraction", "电化学氯离子萃取"),
          pros: [
            bi("Non-destructive", "非开挖式"),
            bi("Treats large areas", "可处理大面积"),
            bi("Long-term protection", "长期防护效果好"),
          ],
          cons: [
            bi("Expensive", "造价高"),
            bi("Specialized equipment", "需专用设备"),
            bi("Time consuming", "工期长"),
          ],
          costLevel: "high" as const,
        },
        {
          method: bi("Repair mortar with corrosion inhibitor", "掺阻锈剂修复砂浆"),
          pros: [
            bi("Cost effective", "造价经济"),
            bi("Standard technology", "常规工艺"),
            bi("Aesthetic repair", "可兼顾外观修复"),
          ],
          cons: [
            bi("Requires concrete removal", "需凿除劣化混凝土"),
            bi("May not stop corrosion", "可能无法完全止锈"),
            bi("Recurring maintenance", "需反复维护"),
          ],
          costLevel: "low" as const,
        },
      ],
      seismic: [
        {
          method: bi("RC shear wall addition", "增设钢筋混凝土抗震墙"),
          pros: [
            bi("Significant stiffness increase", "刚度提升显著"),
            bi("Proven seismic solution", "抗震方案成熟"),
            bi("Durable", "耐久性好"),
          ],
          cons: [
            bi("Major intervention", "干预程度大"),
            bi("Reduces usable space", "占用使用面积"),
            bi("High cost", "造价高"),
          ],
          costLevel: "high" as const,
        },
        {
          method: bi("Steel bracing system", "钢支撑抗震体系"),
          pros: [
            bi("Effective and efficient", "抗震效率高"),
            bi("Can be exposed as design feature", "可外露为设计元素"),
            bi("Faster construction", "施工较快"),
          ],
          cons: [
            bi("Visible intervention", "外观干预明显"),
            bi("Connection detailing critical", "节点构造要求高"),
            bi("Moderate cost", "造价中等"),
          ],
          costLevel: "medium" as const,
        },
      ],
      crack: [
        {
          method: bi("Epoxy injection", "环氧树脂压力灌注"),
          pros: [
            bi("Restores tensile strength", "可恢复抗拉强度"),
            bi("Waterproofs crack", "可止水"),
            bi("Minimal visual impact", "视觉影响小"),
          ],
          cons: [
            bi("Only for inactive cracks", "仅适用于静止裂缝"),
            bi("May fail if movement continues", "持续变形可能失效"),
            bi("Skilled labor required", "需熟练技工"),
          ],
          costLevel: "low" as const,
        },
        {
          method: bi("Flexible sealant (for active cracks)", "弹性密封（活动裂缝）"),
          pros: [
            bi("Accommodates movement", "可适应变形"),
            bi("Easy application", "施工简便"),
            bi("Cost effective", "造价低"),
          ],
          cons: [
            bi("Does not restore strength", "不恢复结构强度"),
            bi("Requires monitoring", "需持续监测"),
            bi("Aesthetic impact", "影响外观"),
          ],
          costLevel: "low" as const,
        },
      ],
      masonry_seismic: [
        {
          method: bi("RC shear wall addition", "增设钢筋混凝土抗震墙"),
          pros: [
            bi("Significantly increases lateral stiffness", "大幅提升抗侧刚度"),
            bi("Suitable for masonry structures", "适用于砌体结构"),
            bi("Proven technology", "技术成熟"),
          ],
          cons: [
            bi("Reduces usable floor area", "占用使用面积"),
            bi("Foundation capacity review required", "需基础承载力复核"),
            bi("High construction disruption", "施工干扰大"),
          ],
          costLevel: "high" as const,
        },
        {
          method: bi("External steel bracing", "外包型钢构抗震加固"),
          pros: [
            bi("Fast strengthening", "加固速度快"),
            bi("Less impact on interiors", "对室内影响较小"),
            bi("Can be exposed as design element", "可部分外露为设计元素"),
          ],
          cons: [
            bi("Fire and corrosion protection required", "需防腐防火处理"),
            bi("Complex connection design", "节点设计复杂"),
            bi("Visible intervention", "外观干预明显"),
          ],
          costLevel: "medium" as const,
        },
        {
          method: bi("Mesh-reinforced mortar jacket", "面层钢筋网砂浆加固"),
          pros: [
            bi("Suitable for masonry walls", "适合砌体墙面"),
            bi("Relatively low cost", "造价相对较低"),
            bi("Can be applied locally", "可局部实施"),
          ],
          cons: [
            bi("Thickens wall", "增厚墙体"),
            bi("Requires reliable anchorage", "需与原砌体可靠锚固"),
            bi("Durability depends on workmanship", "耐久性依赖施工质量"),
          ],
          costLevel: "medium" as const,
        },
      ],
      settlement: [
        {
          method: bi("Grouting and jacking", "注浆抬升"),
          pros: [
            bi("Controlled lift amount", "可控制抬升量"),
            bi("Low disruption to superstructure", "对上部结构干扰小"),
            bi("Suitable for differential settlement", "适合不均匀沉降"),
          ],
          cons: [
            bi("Continuous monitoring required", "需持续监测"),
            bi("Geological constraints", "地质条件限制大"),
            bi("Requires specialist teams", "专业队伍要求高"),
          ],
          costLevel: "high" as const,
        },
        {
          method: bi("Foundation underpinning", "基础扩大与托换"),
          pros: [
            bi("Fundamentally improves bearing", "从根本上提高承载"),
            bi("Suitable for increased loads", "适用于功能加重"),
            bi("Long-term reliability", "长期可靠"),
          ],
          cons: [
            bi("High cost", "造价高"),
            bi("Long schedule", "工期长"),
            bi("Dewatering and shoring needed", "需降水与支护"),
          ],
          costLevel: "high" as const,
        },
        {
          method: bi("Differential settlement relief", "沉降缝与结构释放"),
          pros: [
            bi("Reduces secondary cracking", "减缓次生裂缝"),
            bi("Can align with program reorganization", "可结合功能重组"),
            bi("Flexible implementation", "实施灵活"),
          ],
          cons: [
            bi("Does not increase capacity", "不提高承载力"),
            bi("Waterproofing required", "需防水处理"),
            bi("Structural engineer review required", "需结构工程师复核"),
          ],
          costLevel: "low" as const,
        },
      ],
      joint_strengthening: [
        {
          method: bi("Steel jacket at beam-column joint", "梁柱节点外包钢板"),
          pros: [
            bi("Significantly improves joint shear capacity", "显著提高节点抗剪能力"),
            bi("Relatively controllable construction", "施工相对可控"),
            bi("Suitable for weak frame joints", "适合框架节点薄弱"),
          ],
          cons: [
            bi("High fire and corrosion requirements", "防火防腐要求高"),
            bi("Reduces clear height", "减少净高"),
            bi("Precise layout required", "需精确放样"),
          ],
          costLevel: "medium" as const,
        },
        {
          method: bi("Enlarged joint with high-strength concrete", "节点增大截面"),
          pros: [
            bi("Good monolithic behavior", "整体性好"),
            bi("Good fire resistance", "耐火性能佳"),
            bi("Widely accepted in codes", "规范认可度高"),
          ],
          cons: [
            bi("Complex formwork", "模板支护复杂"),
            bi("Increases self-weight", "增加自重"),
            bi("Occupies space", "占用空间"),
          ],
          costLevel: "medium" as const,
        },
        {
          method: bi("External post-tensioning", "体外预应力加固"),
          pros: [
            bi("Efficient capacity increase", "高效提升承载"),
            bi("Can actively reduce deflection", "可主动改善挠度"),
            bi("Low impact on occupancy", "对使用影响小"),
          ],
          cons: [
            bi("Critical anchorage design", "锚固区设计关键"),
            bi("Long-term monitoring needed", "需长期监测"),
            bi("Higher cost", "造价较高"),
          ],
          costLevel: "high" as const,
        },
      ],
      precast_slab: [
        {
          method: bi("Cast-in-place topping slab", "预制板现浇叠合层"),
          pros: [
            bi("Forms monolithic slab", "形成整体楼板"),
            bi("Improves capacity and stiffness", "可提高承载与刚度"),
            bi("Suitable for increased loads", "适合功能加重"),
          ],
          cons: [
            bi("Increases floor dead load", "增加楼面荷载"),
            bi("Requires slab end anchorage", "需板端锚固"),
            bi("High wet-work volume", "湿作业量大"),
          ],
          costLevel: "medium" as const,
        },
        {
          method: bi("Soffit steel/CFRP strengthening", "板底粘钢或碳纤维加固"),
          pros: [
            bi("No loss of clear height", "不改室内净高"),
            bi("Fast construction", "施工速度快"),
            bi("Suitable for local capacity gaps", "适合局部承载不足"),
          ],
          cons: [
            bi("Fire protection mandatory", "防火处理必须"),
            bi("Sensitive to moisture", "对潮湿环境敏感"),
            bi("Cracks must be sealed first", "需先封闭裂缝"),
          ],
          costLevel: "medium" as const,
        },
        {
          method: bi("Supplementary steel beams under precast units", "增设钢梁支承"),
          pros: [
            bi("Directly shares load", "直接分担荷载"),
            bi("Can integrate with MEP routing", "可结合设备管线整合"),
            bi("Can be phased", "可分期实施"),
          ],
          cons: [
            bi("Reduces clear height", "降低净高"),
            bi("Requires column grid coordination", "需柱网协调"),
            bi("Appearance treatment needed", "外观需处理"),
          ],
          costLevel: "medium" as const,
        },
      ],
      timber_protection: [
        {
          method: bi("Reversible timber propping and bracing", "可逆性支撑加固"),
          pros: [
            bi("Aligns with heritage conservation principles", "符合文物保护原则"),
            bi("Removable", "可拆卸"),
            bi("Minimal damage to original fabric", "对原构件损伤小"),
          ],
          cons: [
            bi("Limited capacity increase", "承载提升有限"),
            bi("Regular maintenance required", "需定期维护"),
            bi("Not for large-span load increases", "不适合大跨度加重"),
          ],
          costLevel: "low" as const,
        },
        {
          method: bi("Concealed steel reinforcement", "隐蔽钢构件加固"),
          pros: [
            bi("Balances capacity and appearance", "兼顾承载与外观"),
            bi("Controls deformation", "可控制变形"),
            bi("Easier to monitor", "便于监测"),
          ],
          cons: [
            bi("Expert review required", "需专家论证"),
            bi("High construction precision", "施工精度高"),
            bi("Higher cost", "造价偏高"),
          ],
          costLevel: "high" as const,
        },
        {
          method: bi("Conservation treatment (pest & moisture)", "防腐防虫处理"),
          pros: [
            bi("Extends timber service life", "延长木构件寿命"),
            bi("Low risk", "风险低"),
            bi("Can sync with other repairs", "可与其他修缮同步"),
          ],
          cons: [
            bi("Does not solve structural deficiency", "不解决结构不足"),
            bi("Recurring maintenance", "需反复维护"),
            bi("Material compatibility review needed", "材料兼容性需评估"),
          ],
          costLevel: "low" as const,
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
