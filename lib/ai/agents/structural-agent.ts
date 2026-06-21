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
        recommendation: 'Seismic assessment required. Consider adding reinforced concrete frame or steel bracing.'
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
   * Suggest strengthening methods
   */
  suggestStrengtheningMethods(
    issue: 'insufficient_capacity' | 'corrosion' | 'seismic' | 'crack'
  ): Array<{ method: string; pros: string[]; cons: string[]; costLevel: 'low' | 'medium' | 'high' }> {
    const methods = {
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
    };

    return methods[issue] || [];
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
