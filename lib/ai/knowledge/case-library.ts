export type CaseOutcome = "success" | "partial" | "failure";

export interface RenovationCase {
  id: string;
  title: string;
  location: string;
  region: string;
  buildingType: string;
  structureType: string;
  originalFunction: string;
  targetFunction: string;
  constructionYear: number;
  grossFloorArea: number;
  strategyType: string;
  outcome: CaseOutcome;
  costLevel: "low" | "medium" | "high";
  costPerSqm?: number;
  durationMonths?: number;
  summary: string;
  lessons: string[];
  failureReasons?: string[];
  tags: string[];
}

export const renovationCases: RenovationCase[] = [
  {
    id: "case-1",
    title: "Shanghai Warehouse to Cultural Center",
    location: "Shanghai",
    region: "华东",
    buildingType: "Industrial",
    structureType: "Reinforced concrete frame",
    originalFunction: "Warehouse",
    targetFunction: "Cultural Center",
    constructionYear: 1982,
    grossFloorArea: 8200,
    strategyType: "adaptive_reuse",
    outcome: "success",
    costLevel: "medium",
    costPerSqm: 2800,
    durationMonths: 18,
    summary:
      "Medium reconfiguration preserved the concrete frame while opening the ground floor for exhibition and adding a perforated facade screen.",
    lessons: [
      "Phased MEP replacement reduced downtime",
      "Fire compartmentation upgrade was the critical path item",
      "Selective slab openings required beam strengthening",
    ],
    tags: ["adaptive-reuse", "cultural", "industrial", "shanghai", "fire", "structure"],
  },
  {
    id: "case-2",
    title: "Xi'an Office Tower Light Renewal",
    location: "Xi'an",
    region: "西北",
    buildingType: "Office",
    structureType: "Reinforced concrete frame",
    originalFunction: "Office",
    targetFunction: "Co-working",
    constructionYear: 1995,
    grossFloorArea: 12000,
    strategyType: "light_renewal",
    outcome: "success",
    costLevel: "low",
    costPerSqm: 1200,
    durationMonths: 8,
    summary:
      "Targeted facade window replacement and MEP upgrades in program zones achieved reopening within one construction season.",
    lessons: [
      "Asbestos survey delayed interior work by 6 weeks",
      "Localized structural repairs only — no capacity increase needed",
      "Energy retrofit paid back within 7 years",
    ],
    tags: ["light-renewal", "office", "xi'an", "energy", "mep"],
  },
  {
    id: "case-3",
    title: "Beijing Factory Deep Recreation",
    location: "Beijing",
    region: "华北",
    buildingType: "Industrial",
    structureType: "Brick-concrete mixed frame",
    originalFunction: "Factory",
    targetFunction: "Mixed-use Creative Park",
    constructionYear: 1978,
    grossFloorArea: 24000,
    strategyType: "deep_recreation",
    outcome: "success",
    costLevel: "high",
    costPerSqm: 4500,
    durationMonths: 30,
    summary:
      "New vertical circulation core, rooftop terrace, and full envelope replacement transformed a derelict factory into a landmark creative campus.",
    lessons: [
      "Foundation capacity verification essential before rooftop addition",
      "Heritage review limited facade demolition scope",
      "Deep recreation required full occupancy relocation",
    ],
    tags: ["deep-recreation", "industrial", "beijing", "heritage", "structure", "facade"],
  },
  {
    id: "case-4",
    title: "Chengdu School to Community Hub",
    location: "Chengdu",
    region: "西南",
    buildingType: "Educational",
    structureType: "Reinforced concrete frame",
    originalFunction: "School",
    targetFunction: "Community Center",
    constructionYear: 1988,
    grossFloorArea: 5600,
    strategyType: "adaptive_reuse",
    outcome: "success",
    costLevel: "medium",
    costPerSqm: 2200,
    durationMonths: 14,
    summary:
      "Accessibility upgrades and fire egress widening enabled occupancy change while preserving the original classroom wing layout.",
    lessons: [
      "Stair widening was more cost-effective than adding an elevator initially",
      "Barrier-free access mandatory for public program",
      "Ceiling height adequate for community use without slab changes",
    ],
    tags: ["adaptive-reuse", "accessibility", "fire", "chengdu", "education"],
  },
  {
    id: "case-5",
    title: "Hangzhou Hotel Facade Upgrade",
    location: "Hangzhou",
    region: "华东",
    buildingType: "Hotel",
    structureType: "Reinforced concrete frame",
    originalFunction: "Hotel",
    targetFunction: "Boutique Hotel",
    constructionYear: 2001,
    grossFloorArea: 9800,
    strategyType: "facade_upgrade",
    outcome: "partial",
    costLevel: "medium",
    costPerSqm: 1800,
    durationMonths: 10,
    summary:
      "Envelope-first renovation with high-performance glazing and MEP optimization improved energy rating without major structural work.",
    lessons: [
      "Window U-value compliance drove full facade replacement",
      "Interior fit-out deferred to owner tenant scope",
      "Operational hotel required night-work phasing",
    ],
    failureReasons: [
      "Original schedule underestimated by 3 months due to live-hotel constraints",
      "Hidden curtain wall anchor corrosion added ¥180/m² unplanned cost",
    ],
    tags: ["facade", "energy", "hotel", "hangzhou", "mep"],
  },
  {
    id: "case-6",
    title: "Xi'an Government Office Conversion — Budget Overrun",
    location: "Xi'an",
    region: "西北",
    buildingType: "Office",
    structureType: "Reinforced concrete frame",
    originalFunction: "Government Office",
    targetFunction: "Community Cultural Center",
    constructionYear: 1986,
    grossFloorArea: 6800,
    strategyType: "adaptive_reuse",
    outcome: "failure",
    costLevel: "high",
    costPerSqm: 3800,
    durationMonths: 28,
    summary:
      "Function conversion stalled after structural capacity gaps and undocumented MEP riser conflicts surfaced mid-construction.",
    lessons: [
      "Always verify live load capacity before public assembly conversion",
      "Complete hazardous materials survey before demolition tender",
    ],
    failureReasons: [
      "No structural as-built — beam strengthening added 35% to capex",
      "MEP riser routing conflict required slab penetration redesign",
      "Fire egress width non-compliance discovered at permit review",
      "Budget contingency of 10% was insufficient for 1980s concrete frame office",
    ],
    tags: ["adaptive-reuse", "office", "xi'an", "cultural", "structure", "fire", "mep"],
  },
  {
    id: "case-7",
    title: "Guangzhou Industrial Loft — Schedule Collapse",
    location: "Guangzhou",
    region: "华南",
    buildingType: "Industrial",
    structureType: "Steel frame",
    originalFunction: "Warehouse",
    targetFunction: "Creative Office",
    constructionYear: 1990,
    grossFloorArea: 15000,
    strategyType: "medium_renovation",
    outcome: "failure",
    costLevel: "high",
    costPerSqm: 3200,
    durationMonths: 24,
    summary:
      "Creative office conversion exceeded schedule by 10 months when heritage facade review and steel corrosion repair scope expanded.",
    lessons: [
      "Steel corrosion survey must cover connections, not just visible members",
      "Heritage overlay districts require pre-application consultation",
    ],
    failureReasons: [
      "Underestimated steel connection replacement scope",
      "Heritage review added 4-month approval cycle",
      "Original 12-month schedule unrealistic for medium renovation at this scale",
    ],
    tags: ["medium-renovation", "industrial", "guangzhou", "heritage", "structure", "schedule"],
  },
];

import { extendedRenovationCases } from "./case-library-extended";

export const allRenovationCases: RenovationCase[] = [
  ...renovationCases,
  ...extendedRenovationCases,
];

export function getCaseById(id: string): RenovationCase | undefined {
  return allRenovationCases.find((c) => c.id === id);
}

export function getCasesByStrategyType(strategyType: string): RenovationCase[] {
  return allRenovationCases.filter((c) => c.strategyType === strategyType);
}

export function getCasesByOutcome(outcome: CaseOutcome): RenovationCase[] {
  return allRenovationCases.filter((c) => c.outcome === outcome);
}
