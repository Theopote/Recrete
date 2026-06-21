import type { ProjectWithRelations } from '@/types';
import { buildingCodes, getCodesForScenario, searchCodes, type BuildingCode, type CodeRequirement } from '../knowledge/code-database';

/**
 * Compliance Review Agent
 * 合规审查Agent - 检查项目是否符合相关建筑规范
 */
export class ComplianceAgent {
  /**
   * Perform comprehensive compliance check
   */
  async performComplianceCheck(project: ProjectWithRelations, context?: {
    ceilingHeight?: number;
    stairWidth?: number;
    fireCompartmentArea?: number;
    hasAccessibleEntrance?: boolean;
    windowUValue?: number;
  }): Promise<{
    overallCompliance: 'compliant' | 'partial' | 'non_compliant';
    checks: ComplianceCheck[];
    criticalIssues: string[];
    recommendations: string[];
    applicableCodes: BuildingCode[];
  }> {
    const checks: ComplianceCheck[] = [];
    const criticalIssues: string[] = [];
    const recommendations: string[] = [];

    // Determine applicable codes
    const scenarios = this.determineScenarios(project);
    const applicableCodes = scenarios.flatMap(s => getCodesForScenario(s))
      .filter((code, index, self) => self.findIndex(c => c.id === code.id) === index);

    // Fire safety checks
    if (project.targetFunction !== project.currentFunction) {
      checks.push({
        category: 'fire',
        code: 'GB 50016-2014',
        requirement: 'Fire compartmentation for occupancy change',
        status: context?.fireCompartmentArea ? 
          (context.fireCompartmentArea <= 2500 ? 'compliant' : 'non_compliant') : 
          'requires_verification',
        actualValue: context?.fireCompartmentArea?.toString(),
        requiredValue: '≤ 2500 m² (Class 1-2)',
        note: 'Function conversion requires fire compartmentation review',
        priority: 'critical',
      });

      if (!context?.fireCompartmentArea || context.fireCompartmentArea > 2500) {
        criticalIssues.push('Fire compartment area may exceed code limits for new occupancy type');
        recommendations.push('Subdivide large floor plates with fire-rated walls or add sprinkler system');
      }
    }

    // Stairway width check
    if (context?.stairWidth) {
      const minWidth = project.floorCount > 6 ? 1.2 : 1.1;
      const compliant = context.stairWidth >= minWidth;
      
      checks.push({
        category: 'fire',
        code: 'GB 50016-2014',
        requirement: 'Evacuation stairway width',
        status: compliant ? 'compliant' : 'non_compliant',
        actualValue: `${context.stairWidth}m`,
        requiredValue: `≥ ${minWidth}m`,
        note: compliant ? 'Meets minimum width requirement' : 'Below minimum width',
        priority: compliant ? 'normal' : 'critical',
      });

      if (!compliant) {
        criticalIssues.push(`Stairway width ${context.stairWidth}m below required ${minWidth}m`);
        recommendations.push('Widen existing stairs or provide additional egress routes');
      }
    } else {
      checks.push({
        category: 'fire',
        code: 'GB 50016-2014',
        requirement: 'Evacuation stairway width',
        status: 'requires_verification',
        actualValue: 'Not measured',
        requiredValue: '≥ 1.2m for multi-story public buildings',
        note: 'Measurement required',
        priority: 'high',
      });
      recommendations.push('Measure all evacuation stairways to verify code compliance');
    }

    // Ceiling height check
    if (context?.ceilingHeight) {
      const minHeight = this.getMinCeilingHeight(project.targetFunction);
      const compliant = context.ceilingHeight >= minHeight;

      checks.push({
        category: 'general',
        code: 'GB 50352-2019',
        requirement: 'Minimum ceiling height',
        status: compliant ? 'compliant' : 'non_compliant',
        actualValue: `${context.ceilingHeight}m`,
        requiredValue: `≥ ${minHeight}m`,
        note: compliant ? 'Meets minimum height' : 'Below required height',
        priority: compliant ? 'normal' : 'high',
      });

      if (!compliant) {
        recommendations.push(`Ceiling height ${context.ceilingHeight}m may limit functionality. Consider raised floors or selective slab openings.`);
      }
    }

    // Energy efficiency check
    if (context?.windowUValue) {
      const maxUValue = this.getMaxWindowUValue(project.location);
      const compliant = context.windowUValue <= maxUValue;

      checks.push({
        category: 'energy',
        code: 'GB 50189-2015',
        requirement: 'External window U-value',
        status: compliant ? 'compliant' : 'non_compliant',
        actualValue: `${context.windowUValue} W/(m²·K)`,
        requiredValue: `≤ ${maxUValue} W/(m²·K)`,
        note: compliant ? 'Meets energy efficiency requirement' : 'Exceeds maximum U-value',
        priority: compliant ? 'normal' : 'medium',
      });

      if (!compliant) {
        recommendations.push('Window replacement required to meet energy code. Consider double or triple glazing.');
      }
    }

    // Accessibility check
    if (project.targetFunction.includes('公共') || project.targetFunction.includes('文化') || 
        project.targetFunction.toLowerCase().includes('public') || project.targetFunction.toLowerCase().includes('cultural')) {
      
      const hasAccessible = context?.hasAccessibleEntrance ?? false;
      checks.push({
        category: 'accessibility',
        code: 'GB 50763-2012',
        requirement: 'Accessible entrance',
        status: hasAccessible ? 'compliant' : 'non_compliant',
        actualValue: hasAccessible ? 'Provided' : 'Not provided',
        requiredValue: 'At least one accessible entrance required',
        note: hasAccessible ? 'Accessible entrance available' : 'No accessible entrance',
        priority: hasAccessible ? 'normal' : 'high',
      });

      if (!hasAccessible) {
        recommendations.push('Install accessible ramp or level entrance at main entry (max slope 1:12)');
        recommendations.push('Provide accessible toilet facilities on each public floor');
      }
    }

    // Determine overall compliance
    const nonCompliantCount = checks.filter(c => c.status === 'non_compliant').length;
    const criticalNonCompliant = checks.filter(c => c.status === 'non_compliant' && c.priority === 'critical').length;
    
    let overallCompliance: 'compliant' | 'partial' | 'non_compliant';
    if (criticalNonCompliant > 0 || nonCompliantCount >= 3) {
      overallCompliance = 'non_compliant';
    } else if (nonCompliantCount > 0) {
      overallCompliance = 'partial';
    } else {
      overallCompliance = 'compliant';
    }

    // Add general recommendations
    recommendations.push('Engage licensed professionals for final code compliance review');
    recommendations.push('Submit design to local authorities for approval before construction');
    
    if (project.constructionYear < 2010) {
      recommendations.push('Review seismic code compliance - building predates GB 50011-2010');
    }

    return {
      overallCompliance,
      checks,
      criticalIssues,
      recommendations,
      applicableCodes,
    };
  }

  /**
   * Search codes by keyword
   */
  searchCodeRequirements(keyword: string): Array<{
    code: BuildingCode;
    requirement: CodeRequirement;
    relevance: string;
  }> {
    const results = searchCodes(keyword);
    return results.map(r => ({
      code: r.code,
      requirement: r.requirement,
      relevance: 'Keyword match in title or description',
    }));
  }

  /**
   * Get checklist for specific compliance area
   */
  getComplianceChecklist(area: 'fire' | 'structure' | 'accessibility' | 'energy'): string[] {
    const code = buildingCodes.find(c => c.category === area);
    if (!code) return [];

    const checklist: string[] = [];
    for (const req of code.keyRequirements) {
      if (req.checklistItems) {
        checklist.push(...req.checklistItems);
      } else {
        checklist.push(`Verify ${req.titleZh} (${req.section})`);
      }
    }

    return checklist;
  }

  private determineScenarios(project: ProjectWithRelations): string[] {
    const scenarios = ['all'];
    
    if (project.targetFunction !== project.currentFunction) {
      scenarios.push('function_conversion');
    }
    
    if (project.originalFunction.includes('办公') || project.originalFunction.toLowerCase().includes('office')) {
      scenarios.push('office_renovation');
    }

    // Add more scenario logic
    scenarios.push('pre_renovation_inspection');

    return scenarios;
  }

  private getMinCeilingHeight(targetFunction: string): number {
    if (targetFunction.includes('教室') || targetFunction.toLowerCase().includes('classroom')) {
      return 3.1;
    }
    if (targetFunction.includes('展') || targetFunction.toLowerCase().includes('exhibition')) {
      return 3.0;
    }
    return 2.8; // Default for office/general use
  }

  private getMaxWindowUValue(location: string): number {
    // Simplified - should use more detailed climate zone mapping
    if (location.includes('西安') || location.includes('北京') || location.includes('Xi\'an') || location.includes('Beijing')) {
      return 2.2; // Cold zone
    }
    if (location.includes('上海') || location.includes('Shanghai')) {
      return 2.5; // Hot summer cold winter
    }
    return 2.5; // Default
  }
}

interface ComplianceCheck {
  category: 'fire' | 'structure' | 'accessibility' | 'energy' | 'general';
  code: string;
  requirement: string;
  status: 'compliant' | 'non_compliant' | 'requires_verification' | 'not_applicable';
  actualValue?: string;
  requiredValue: string;
  note: string;
  priority: 'critical' | 'high' | 'medium' | 'normal';
}

export const complianceAgent = new ComplianceAgent();
