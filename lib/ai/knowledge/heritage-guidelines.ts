export interface HeritageGuideline {
  id: string;
  titleEn: string;
  titleZh: string;
  principleEn: string;
  principleZh: string;
}

export const HERITAGE_GUIDELINES: HeritageGuideline[] = [
  {
    id: "minimum-intervention",
    titleEn: "Minimum intervention",
    titleZh: "最小干预",
    principleEn: "Repair before replace; preserve authentic fabric and reversible details.",
    principleZh: "优先修缮而非替换；保留真实构件，采用可逆细部做法。",
  },
  {
    id: "authenticity",
    titleEn: "Authenticity & integrity",
    titleZh: "原真性与完整性",
    principleEn: "Document character-defining elements before any intervention.",
    principleZh: "干预前完整记录价值要素、材料体系与历史层次。",
  },
  {
    id: "reversibility",
    titleEn: "Reversible design",
    titleZh: "可逆性设计",
    principleEn: "New insertions must be distinguishable and removable without harming heritage fabric.",
    principleZh: "新增构造应可识别、可拆除，且不得损伤保护本体。",
  },
  {
    id: "approval",
    titleEn: "Regulatory approval",
    titleZh: "审批程序",
    principleEn: "Renovation plans for protected buildings require cultural relics authority review.",
    principleZh: "文保建筑修缮方案须报文物主管部门审批后方可实施。",
  },
];

export const AUTHENTICITY_FACTORS = [
  { key: "facade_fabric", labelEn: "Facade fabric", labelZh: "立面原真性" },
  { key: "structural_system", labelEn: "Structural system", labelZh: "结构体系" },
  { key: "interior_features", labelEn: "Interior features", labelZh: "室内价值要素" },
  { key: "site_context", labelEn: "Site context", labelZh: "环境与街巷肌理" },
] as const;
