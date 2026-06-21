export interface RenovationCase {
  id: string;
  title: string;
  location: string;
  buildingType: string;
  originalFunction: string;
  targetFunction: string;
  constructionYear: number;
  grossFloorArea: number;
  strategyType: string;
  costLevel: "low" | "medium" | "high";
  costPerSqm?: number;
  durationMonths?: number;
  summary: string;
  lessons: string[];
  tags: string[];
}

export const renovationCases: RenovationCase[] = [
  {
    id: "case-1",
    title: "Shanghai Warehouse to Cultural Center",
    location: "Shanghai",
    buildingType: "Industrial",
    originalFunction: "Warehouse",
    targetFunction: "Cultural Center",
    constructionYear: 1982,
    grossFloorArea: 8200,
    strategyType: "adaptive_reuse",
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
    buildingType: "Office",
    originalFunction: "Office",
    targetFunction: "Co-working",
    constructionYear: 1995,
    grossFloorArea: 12000,
    strategyType: "light_renewal",
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
    buildingType: "Industrial",
    originalFunction: "Factory",
    targetFunction: "Mixed-use Creative Park",
    constructionYear: 1978,
    grossFloorArea: 24000,
    strategyType: "deep_recreation",
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
    buildingType: "Educational",
    originalFunction: "School",
    targetFunction: "Community Center",
    constructionYear: 1988,
    grossFloorArea: 5600,
    strategyType: "adaptive_reuse",
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
    buildingType: "Hotel",
    originalFunction: "Hotel",
    targetFunction: "Boutique Hotel",
    constructionYear: 2001,
    grossFloorArea: 9800,
    strategyType: "facade_upgrade",
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
    tags: ["facade", "energy", "hotel", "hangzhou", "mep"],
  },
];

export function getCaseById(id: string): RenovationCase | undefined {
  return renovationCases.find((c) => c.id === id);
}

export function getCasesByStrategyType(strategyType: string): RenovationCase[] {
  return renovationCases.filter((c) => c.strategyType === strategyType);
}
