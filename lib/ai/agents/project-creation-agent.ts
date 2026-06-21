import type { CreateProjectInput, BudgetLevel, RiskLevel } from "@/types";
import type { AIInsight, AITask, BuildingMemory } from "@/types/ai";
import { generateProjectCode } from "@/lib/utils";
import { withMockDelay } from "../providers/utils";

export interface AIProjectDraft {
  project: CreateProjectInput;
  riskLevel: RiskLevel;
  healthScore: number;
  potentialScore: number;
  aiReadinessScore: number;
  dataCompletenessScore: number;
  buildingMemory: Omit<BuildingMemory, "id" | "projectId" | "createdAt" | "updatedAt">;
  tasks: Omit<AITask, "id" | "projectId" | "createdAt" | "updatedAt">[];
  insights: Omit<AIInsight, "id" | "projectId" | "createdAt" | "updatedAt">[];
  analysisSummary: string;
}

function extractYear(text: string): number {
  const match = text.match(/(?:建成于|建于|built in|constructed in|year)\s*(\d{4})|(\d{4})\s*年/gi);
  if (match) {
    const year = match[0].match(/\d{4}/);
    if (year) return parseInt(year[0], 10);
  }
  const fallback = text.match(/\b(19\d{2}|20\d{2})\b/);
  return fallback ? parseInt(fallback[1], 10) : 1985;
}

function extractLocation(text: string): string {
  const cities: Record<string, string> = {
    西安: "Xi'an, China",
    北京: "Beijing, China",
    上海: "Shanghai, China",
    广州: "Guangzhou, China",
    深圳: "Shenzhen, China",
    成都: "Chengdu, China",
    杭州: "Hangzhou, China",
  };
  for (const [cn, en] of Object.entries(cities)) {
    if (text.includes(cn)) return en;
  }
  const enMatch = text.match(/(?:in|located in|位于)\s+([A-Za-z\u4e00-\u9fff\s,]+?)(?:[，,。.]|$)/i);
  if (enMatch) return enMatch[1].trim();
  return "China";
}

function extractStructure(text: string): string {
  if (/混凝土框架| reinforced concrete frame|RC frame/i.test(text)) {
    return "Reinforced concrete frame";
  }
  if (/砖混|brick/i.test(text)) return "Brick and concrete";
  if (/钢结构|steel frame/i.test(text)) return "Steel frame";
  if (/框架|frame/i.test(text)) return "Concrete frame";
  return "Reinforced concrete frame";
}

function extractFunctions(text: string): {
  original: string;
  current: string;
  target: string;
} {
  let original = "Office";
  let target = "Mixed-use";

  if (/政府办公|government office/i.test(text)) original = "Government office";
  else if (/工厂|factory/i.test(text)) original = "Industrial factory";
  else if (/学校|school/i.test(text)) original = "School";
  else if (/仓库|warehouse/i.test(text)) original = "Warehouse";

  if (/社区文化中心|cultural center|community center/i.test(text)) {
    target = "Community cultural center";
  } else if (/创意|creative|co-?working/i.test(text)) {
    target = "Creative office hub";
  } else if (/酒店|hotel/i.test(text)) {
    target = "Boutique hotel";
  } else if (/住宅|residential|apartment/i.test(text)) {
    target = "Residential apartments";
  } else if (/改成|改为|convert|transform|想改/i.test(text)) {
    const m = text.match(/(?:改成|改为|convert to|transform into|想改成)\s*([^，,。.]+)/i);
    if (m) target = m[1].trim();
  }

  const current = /空置|vacant|abandoned|闲置/i.test(text)
    ? `Vacant ${original.toLowerCase()}`
    : original;

  return { original, current, target };
}

function extractBudget(text: string): BudgetLevel {
  if (/预算有限|budget.?limit|low budget|tight budget|成本敏感/i.test(text)) return "low";
  if (/充足|premium|high.?end|不限预算/i.test(text)) return "high";
  return "medium";
}

function extractBuildingType(text: string, original: string): string {
  if (/办公楼|office/i.test(text)) return "Office building";
  if (/厂房|factory|industrial/i.test(text)) return "Industrial building";
  if (/学校|school/i.test(text)) return "Educational building";
  if (/住宅|residential/i.test(text)) return "Residential building";
  return `${original} building`;
}

function extractFloors(text: string): number {
  const m = text.match(/(\d+)\s*(?:层|floor|story|stories)/i);
  return m ? parseInt(m[1], 10) : 6;
}

function extractArea(text: string): number {
  const m = text.match(/(\d{3,5})\s*(?:sqm|㎡|平方米|平米)/i);
  return m ? parseInt(m[1], 10) : 4200;
}

function buildProjectName(location: string, target: string, year: number): string {
  const city = location.split(",")[0]?.trim() ?? "Building";
  const shortTarget = target.split(" ")[0] ?? "Renovation";
  return `${city} ${year} ${shortTarget} Renewal`;
}

function parseBriefSync(brief: string): AIProjectDraft {
  const text = brief.trim();
  const year = extractYear(text);
  const location = extractLocation(text);
  const structureType = extractStructure(text);
  const { original, current, target } = extractFunctions(text);
  const budgetLevel = extractBudget(text);
  const buildingType = extractBuildingType(text, original);
  const floorCount = extractFloors(text);
  const grossFloorArea = extractArea(text);
  const preserveStructure = /保留主体|preserve.*structure|keep.*frame|保留结构/i.test(text);

  const name = buildProjectName(location, target, year);
  const cityCode = location.split(",")[0]?.slice(0, 2) ?? "XX";

  const project: CreateProjectInput = {
    name,
    code: generateProjectCode(cityCode, year),
    location,
    buildingType,
    originalFunction: original,
    currentFunction: current,
    targetFunction: target,
    constructionYear: year,
    structureType,
    floorCount,
    grossFloorArea,
    renovationGoal: text,
    budgetLevel,
    description: `AI-generated from brief: ${text.slice(0, 120)}${text.length > 120 ? "…" : ""}`,
    buildingName: name,
    address: location,
    basementCount: 1,
    currentCondition: `${year} ${structureType.toLowerCase()} building requiring renovation assessment. Original use: ${original.toLowerCase()}.`,
    heritageLevel: "none",
  };

  const missingInformation = [
    "Complete structural as-built drawings",
    "Hazardous materials (asbestos) survey",
    "Fire engineering report for occupancy change",
    "MEP capacity assessment",
    "Facade condition survey photos",
  ];

  const keyRisks = [
    preserveStructure
      ? "Structural capacity verification required before major program changes while preserving frame"
      : "Structural condition unknown — 1980s concrete may have carbonation or cover loss",
    `Occupancy change (${original} → ${target}) triggers fire and egress code review`,
    budgetLevel === "low"
      ? "Limited budget constrains MEP and accessibility upgrades — phasing strategy needed"
      : "Scope creep risk if program requirements exceed envelope capacity",
    `${year} building likely contains asbestos in floor finishes and mastic`,
  ];

  const renovationPotential =
    budgetLevel === "low" && preserveStructure
      ? "Strong adaptive reuse potential with light-to-medium intervention. Preserving the concrete frame aligns with budget constraints while enabling community cultural programming through interior reconfiguration."
      : `High potential for ${target.toLowerCase()} conversion. ${structureType} provides flexible open spans suitable for adaptive reuse with targeted envelope and MEP upgrades.`;

  const buildingMemory: AIProjectDraft["buildingMemory"] = {
    summary: `${name} is a ${year} ${structureType.toLowerCase()} in ${location}, converting from ${original.toLowerCase()} to ${target.toLowerCase()}. AI initial assessment complete — ${missingInformation.length} critical information gaps identified.`,
    knownFacts: [
      `Built ${year}, ${structureType}, approximately ${floorCount} floors, ~${grossFloorArea.toLocaleString()} sqm GFA`,
      `Original function: ${original} → Target: ${target}`,
      preserveStructure ? "Owner intent: preserve primary structural frame" : "Structural approach to be determined",
      `Budget profile: ${budgetLevel}`,
      `Renovation brief captured in natural language`,
    ],
    missingInformation,
    keyRisks,
    renovationPotential,
    designConstraints: [
      `Budget level: ${budgetLevel}`,
      preserveStructure ? "Preserve primary structural frame" : "Structural modifications subject to engineer review",
      `Target program: ${target}`,
    ],
    ownerRequirements: [text],
    importantDecisions: [],
    unresolvedQuestions: [
      "Can renovation be phased to allow partial occupancy during construction?",
      "Which strategy tier (light / medium / deep) best fits budget and program goals?",
      "Is additional vertical circulation required for assembly occupancy?",
    ],
    lastUpdatedByAI: new Date(),
  };

  const tasks: AIProjectDraft["tasks"] = [
    {
      title: "Upload structural as-built drawings",
      description: "Obtain or commission measured structural drawings before schematic design.",
      category: "documentation",
      priority: "high",
      status: "pending",
      insightId: null,
      assignedToId: null,
      dueDate: new Date(Date.now() + 14 * 86400000),
    },
    {
      title: "Commission hazardous materials survey",
      description: `Buildings from ${year} commonly contain asbestos. Survey required before demolition.`,
      category: "compliance",
      priority: "critical",
      status: "pending",
      insightId: null,
      assignedToId: null,
      dueDate: new Date(Date.now() + 7 * 86400000),
    },
    {
      title: "Schedule site photo survey",
      description: "Document facade, roof, interior conditions, and MEP equipment.",
      category: "survey",
      priority: "high",
      status: "pending",
      insightId: null,
      assignedToId: null,
      dueDate: new Date(Date.now() + 10 * 86400000),
    },
    {
      title: "Review fire egress for occupancy change",
      description: `Verify stair widths and egress capacity for conversion to ${target.toLowerCase()}.`,
      category: "fire_safety",
      priority: "high",
      status: "pending",
      insightId: null,
      assignedToId: null,
      dueDate: new Date(Date.now() + 21 * 86400000),
    },
  ];

  const insights: AIProjectDraft["insights"] = [
    {
      title: "Occupancy change requires code compliance review",
      type: "compliance_warning",
      priority: "high",
      summary: `Converting from ${original.toLowerCase()} to ${target.toLowerCase()} triggers fire safety, accessibility, and egress requirements.`,
      evidence: "AI analysis of brief and typical code requirements for assembly occupancy",
      recommendation: "Engage fire engineer early. Verify stair and corridor widths.",
      confidence: 0.88,
      status: "open",
      sourceType: "user_note",
      sourceId: null,
    },
    {
      title: "Critical documentation gaps detected",
      type: "missing_info",
      priority: "high",
      summary: `${missingInformation.length} essential documents missing — structural drawings, hazmat survey, and MEP records needed before design.`,
      evidence: "No documents uploaded at project creation",
      recommendation: "Prioritize structural as-built and hazardous materials survey.",
      confidence: 0.92,
      status: "open",
      sourceType: "user_note",
      sourceId: null,
    },
    {
      title: preserveStructure ? "Frame preservation aligns with budget" : "Adaptive reuse opportunity identified",
      type: "opportunity",
      priority: "medium",
      summary: renovationPotential,
      evidence: "AI assessment of building type, age, and owner requirements",
      recommendation: "Proceed to Strategy Lab to compare light, medium, and deep intervention options.",
      confidence: 0.85,
      status: "open",
      sourceType: "user_note",
      sourceId: null,
    },
  ];

  const riskLevel: RiskLevel =
    budgetLevel === "low" && year < 1990 ? "medium" : year < 1970 ? "high" : "medium";

  return {
    project,
    riskLevel,
    healthScore: year > 2000 ? 65 : year > 1980 ? 52 : 42,
    potentialScore: target.includes("cultural") ? 78 : 68,
    aiReadinessScore: 55,
    dataCompletenessScore: 15,
    buildingMemory,
    tasks,
    insights,
    analysisSummary: `Created project "${name}" from brief. Identified ${keyRisks.length} risks, ${missingInformation.length} missing documents, and ${tasks.length} recommended next steps.`,
  };
}

export async function parseProjectBrief(brief: string): Promise<AIProjectDraft> {
  return withMockDelay(() => parseBriefSync(brief), 1800);
}
