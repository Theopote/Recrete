/**
 * Building codes and standards knowledge base
 * 建筑规范与标准知识库
 */

export interface BuildingCode {
  id: string;
  name: string;
  nameZh: string;
  code: string;
  category: 'fire' | 'structure' | 'accessibility' | 'energy' | 'heritage' | 'general';
  version: string;
  effectiveDate: string;
  keyRequirements: CodeRequirement[];
  applicableScenarios: string[];
}

export interface CodeRequirement {
  section: string;
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  parameters?: Record<string, any>;
  checklistItems?: string[];
}

/**
 * Core building codes for renovation projects in China
 */
export const buildingCodes: BuildingCode[] = [
  {
    id: 'gb50352',
    name: 'Code for Design of Civil Buildings',
    nameZh: '民用建筑设计统一标准',
    code: 'GB 50352-2019',
    category: 'general',
    version: '2019',
    effectiveDate: '2019-10-01',
    keyRequirements: [
      {
        section: '6.7.2',
        title: 'Floor Live Load',
        titleZh: '楼面活荷载',
        description: 'Office buildings: 2.0 kN/m², Assembly halls: 3.5 kN/m²',
        descriptionZh: '办公楼：2.0 kN/m²，会堂：3.5 kN/m²',
        parameters: {
          office: 2.0,
          assembly: 3.5,
          exhibition: 3.5,
          library_reading: 2.5,
          library_stack: 5.0,
        },
      },
      {
        section: '6.6.1',
        title: 'Ceiling Height',
        titleZh: '层高要求',
        description: 'Minimum ceiling height for habitable rooms: 2.8m',
        descriptionZh: '居住、办公等主要使用房间净高不应低于2.80m',
        parameters: {
          office_min: 2.8,
          classroom_min: 3.1,
          exhibition_min: 3.0,
        },
      },
    ],
    applicableScenarios: ['all', 'office_renovation', 'function_conversion'],
  },
  {
    id: 'gb50016',
    name: 'Code for Fire Protection Design of Buildings',
    nameZh: '建筑设计防火规范',
    code: 'GB 50016-2014 (2018版)',
    category: 'fire',
    version: '2018',
    effectiveDate: '2018-10-01',
    keyRequirements: [
      {
        section: '5.5.13',
        title: 'Fire Compartmentation',
        titleZh: '防火分区',
        description: 'Max fire compartment area for multi-story buildings varies by fire resistance rating',
        descriptionZh: '多层建筑防火分区最大允许建筑面积根据耐火等级确定',
        parameters: {
          class_1_2: 2500,
          class_3: 1200,
          class_4: 600,
        },
        checklistItems: [
          'Check building fire resistance rating',
          'Calculate existing fire compartment areas',
          'Verify fire separation walls and doors',
          'Ensure sprinkler system if required',
        ],
      },
      {
        section: '5.5.18',
        title: 'Evacuation Stairway Width',
        titleZh: '疏散楼梯宽度',
        description: 'Minimum 1.2m for multi-story buildings, 1.1m for residential',
        descriptionZh: '多层公共建筑疏散楼梯净宽度不应小于1.20m',
        parameters: {
          public_multi_story: 1.2,
          residential: 1.1,
          high_rise: 1.2,
        },
      },
      {
        section: '8.3.3',
        title: 'Interior Finish Flame Spread Rating',
        titleZh: '装修材料燃烧性能',
        description: 'Ceiling and wall finishes must meet flame spread class requirements',
        descriptionZh: '顶棚、墙面装修材料燃烧性能等级要求',
        checklistItems: [
          'Identify building occupancy type',
          'Determine required flame spread class for ceilings',
          'Determine required flame spread class for walls',
          'Verify material certificates',
        ],
      },
    ],
    applicableScenarios: ['all', 'function_conversion', 'interior_renovation'],
  },
  {
    id: 'gb50763',
    name: 'Code for Appraisal of Reliability of Civil Buildings',
    nameZh: '民用建筑可靠性鉴定标准',
    code: 'GB 50292-2015',
    category: 'structure',
    version: '2015',
    effectiveDate: '2016-08-01',
    keyRequirements: [
      {
        section: '7.3.5',
        title: 'Concrete Carbonation Depth',
        titleZh: '混凝土碳化深度',
        description: 'Safety class rating based on carbonation depth relative to cover thickness',
        descriptionZh: '根据碳化深度与保护层厚度比值评定等级',
        parameters: {
          class_a: '< 0.5', // 碳化深度/保护层厚度
          class_b: '0.5 - 0.8',
          class_c: '0.8 - 1.0',
          class_d: '> 1.0',
        },
      },
      {
        section: '8.2.3',
        title: 'Structural Component Rating',
        titleZh: '结构构件评级',
        description: 'Component safety rating: A (safe), B (acceptable), C (marginally safe), D (unsafe)',
        descriptionZh: '构件安全性等级：A级（安全）、B级（基本安全）、C级（不安全）、D级（严重不安全）',
      },
    ],
    applicableScenarios: ['structural_assessment', 'pre_renovation_inspection'],
  },
  {
    id: 'gb50763',
    name: 'Code for Energy Conservation in Public Buildings',
    nameZh: '公共建筑节能设计标准',
    code: 'GB 50189-2015',
    category: 'energy',
    version: '2015',
    effectiveDate: '2015-10-01',
    keyRequirements: [
      {
        section: '4.2.2',
        title: 'External Window U-value',
        titleZh: '外窗传热系数',
        description: 'Maximum U-value varies by climate zone',
        descriptionZh: '不同气候区外窗传热系数限值',
        parameters: {
          severe_cold: 2.0,
          cold: 2.2,
          hot_summer_cold_winter: 2.5,
          hot_summer_warm_winter: 3.0,
        },
      },
      {
        section: '4.2.4',
        title: 'External Wall Thermal Performance',
        titleZh: '外墙热工性能',
        description: 'Required R-value for external walls',
        descriptionZh: '外墙传热系数和热惰性指标要求',
      },
    ],
    applicableScenarios: ['facade_renovation', 'window_replacement', 'energy_retrofit'],
  },
  {
    id: 'gb50763_accessibility',
    name: 'Code for Accessibility Design of Buildings',
    nameZh: '无障碍设计规范',
    code: 'GB 50763-2012',
    category: 'accessibility',
    version: '2012',
    effectiveDate: '2012-09-01',
    keyRequirements: [
      {
        section: '3.2.1',
        title: 'Accessible Entrance',
        titleZh: '无障碍入口',
        description: 'At least one main entrance must be accessible with ramp or level access',
        descriptionZh: '主要出入口应设置轮椅坡道或平坡入口',
        checklistItems: [
          'Ensure at least one accessible entrance',
          'Ramp slope should not exceed 1:12',
          'Provide handrails on both sides',
          'Minimum clear width 1.2m',
        ],
      },
      {
        section: '3.9',
        title: 'Accessible Toilet',
        titleZh: '无障碍卫生间',
        description: 'Public buildings must provide accessible toilet facilities',
        descriptionZh: '公共建筑的公共卫生间应设无障碍设施',
        parameters: {
          min_clear_space: 1.5, // meters
          door_min_width: 0.9,
          grab_bar_required: true,
        },
      },
    ],
    applicableScenarios: ['public_building_renovation', 'function_conversion'],
  },
];

/**
 * Check compliance against specific code requirement
 */
export function checkCodeCompliance(
  codeId: string,
  section: string,
  actualValue: number,
  paramKey: string
): {
  compliant: boolean;
  required: number | string;
  actual: number;
  note: string;
} {
  const code = buildingCodes.find((c) => c.id === codeId);
  if (!code) {
    return { compliant: false, required: 'N/A', actual: actualValue, note: 'Code not found' };
  }

  const requirement = code.keyRequirements.find((r) => r.section === section);
  if (!requirement || !requirement.parameters) {
    return { compliant: false, required: 'N/A', actual: actualValue, note: 'Requirement not found' };
  }

  const required = requirement.parameters[paramKey];
  if (typeof required === 'number') {
    const compliant = actualValue >= required;
    return {
      compliant,
      required,
      actual: actualValue,
      note: compliant ? 'Meets requirement' : 'Below minimum requirement',
    };
  }

  return { compliant: false, required, actual: actualValue, note: 'Check manually' };
}

/**
 * Get relevant codes for a specific scenario
 */
export function getCodesForScenario(scenario: string): BuildingCode[] {
  return buildingCodes.filter((code) => code.applicableScenarios.includes(scenario) || code.applicableScenarios.includes('all'));
}

/**
 * Search codes by keyword
 */
export function searchCodes(keyword: string): { code: BuildingCode; requirement: CodeRequirement }[] {
  const results: { code: BuildingCode; requirement: CodeRequirement }[] = [];
  const lowerKeyword = keyword.toLowerCase();

  for (const code of buildingCodes) {
    for (const req of code.keyRequirements) {
      if (
        req.title.toLowerCase().includes(lowerKeyword) ||
        req.titleZh.includes(keyword) ||
        req.description.toLowerCase().includes(lowerKeyword) ||
        req.descriptionZh.includes(keyword)
      ) {
        results.push({ code, requirement: req });
      }
    }
  }

  return results;
}
