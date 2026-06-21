import type {
  AIConversation,
  AIMessage,
  Building,
  DashboardStats,
  DiagnosisItem,
  DocumentAsset,
  Organization,
  Project,
  ProjectWithRelations,
  RenovationStrategy,
  Report,
  SiteIssue,
  User,
} from "@/types";
import {
  mockAIInsights,
  mockAITasks,
  mockAnalysisRuns,
  mockBuildingMemories,
  mockSourceEvidence,
  documentAISummaries,
} from "@/lib/mock-data/ai-native";

const now = new Date("2026-06-15T10:00:00Z");
const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000);

export const mockUsers: User[] = [
  {
    id: "user-1",
    name: "Lin Wei",
    email: "lin.wei@recrete.io",
    avatarUrl: null,
    role: "architect",
    createdAt: daysAgo(180),
    updatedAt: daysAgo(1),
  },
  {
    id: "user-2",
    name: "Chen Hao",
    email: "chen.hao@recrete.io",
    avatarUrl: null,
    role: "engineer",
    createdAt: daysAgo(120),
    updatedAt: daysAgo(2),
  },
  {
    id: "user-3",
    name: "Zhang Mei",
    email: "zhang.mei@recrete.io",
    avatarUrl: null,
    role: "project_manager",
    createdAt: daysAgo(90),
    updatedAt: daysAgo(3),
  },
];

export const mockOrganization: Organization = {
  id: "org-1",
  name: "Recrete Studio",
  description: "Adaptive reuse and renovation consultancy",
  createdAt: daysAgo(365),
  updatedAt: daysAgo(10),
};

export const mockProjects: Project[] = [
  {
    id: "proj-demo",
    organizationId: "org-1",
    name: "Old Concrete Office Renewal",
    code: "RC-XA-1986-001",
    location: "Xi'an, China",
    buildingType: "Office building",
    originalFunction: "Government office",
    currentFunction: "Vacant office",
    targetFunction: "Community cultural center",
    constructionYear: 1986,
    structureType: "Reinforced concrete frame",
    floorCount: 8,
    grossFloorArea: 12800,
    status: "diagnosis",
    renovationGoal:
      "Transform the outdated office building into a public cultural and learning hub while preserving the main concrete structure.",
    budgetLevel: "medium",
    riskLevel: "medium",
    healthScore: 58,
    potentialScore: 82,
    aiReadinessScore: 72,
    dataCompletenessScore: 58,
    description:
      "A 1986 reinforced concrete frame office building in central Xi'an, vacant since 2019. Strong structural bones but outdated MEP, poor accessibility, and deteriorating facade.",
    createdAt: daysAgo(45),
    updatedAt: daysAgo(1),
  },
  {
    id: "proj-2",
    organizationId: "org-1",
    name: "Riverside Warehouse Adaptive Reuse",
    code: "RC-SH-1972-002",
    location: "Shanghai, China",
    buildingType: "Industrial warehouse",
    originalFunction: "Textile storage",
    currentFunction: "Partially vacant warehouse",
    targetFunction: "Creative office and retail",
    constructionYear: 1972,
    structureType: "Steel frame with brick infill",
    floorCount: 3,
    grossFloorArea: 15600,
    status: "strategy",
    renovationGoal:
      "Convert the riverside warehouse into a mixed-use creative hub while retaining industrial character.",
    budgetLevel: "high",
    riskLevel: "high",
    healthScore: 45,
    potentialScore: 88,
    aiReadinessScore: 65,
    dataCompletenessScore: 45,
    description: "Heritage-adjacent industrial asset with waterfront potential.",
    createdAt: daysAgo(60),
    updatedAt: daysAgo(5),
  },
  {
    id: "proj-3",
    organizationId: "org-1",
    name: "Huangpu Lane Residential Upgrade",
    code: "RC-GZ-1998-003",
    location: "Guangzhou, China",
    buildingType: "Residential block",
    originalFunction: "Staff dormitory",
    currentFunction: "Aging residential",
    targetFunction: "Affordable rental housing",
    constructionYear: 1998,
    structureType: "Shear wall",
    floorCount: 12,
    grossFloorArea: 9200,
    status: "survey",
    renovationGoal: "Upgrade living conditions and energy performance for continued residential use.",
    budgetLevel: "medium",
    riskLevel: "low",
    healthScore: 62,
    potentialScore: 71,
    aiReadinessScore: 54,
    dataCompletenessScore: 38,
    description: "Mid-rise residential block requiring envelope and MEP upgrades.",
    createdAt: daysAgo(20),
    updatedAt: daysAgo(2),
  },
  {
    id: "proj-4",
    organizationId: "org-1",
    name: "Nanjing Road Facade Renewal",
    code: "RC-NJ-1965-004",
    location: "Nanjing, China",
    buildingType: "Mixed-use commercial",
    originalFunction: "Department store",
    currentFunction: "Underutilized retail",
    targetFunction: "Boutique hotel and F&B",
    constructionYear: 1965,
    structureType: "Reinforced concrete frame",
    floorCount: 6,
    grossFloorArea: 7400,
    status: "design",
    renovationGoal: "Restore street-facing heritage character while upgrading interior for hospitality use.",
    budgetLevel: "premium",
    riskLevel: "critical",
    healthScore: 38,
    potentialScore: 91,
    aiReadinessScore: 78,
    dataCompletenessScore: 62,
    description: "Landmark commercial building with heritage constraints and complex stakeholder requirements.",
    createdAt: daysAgo(120),
    updatedAt: daysAgo(1),
  },
];

export const mockBuildings: Building[] = [
  {
    id: "bld-demo",
    projectId: "proj-demo",
    name: "Former Municipal Office Block A",
    address: "No. 88 South Ring Road, Beilin District, Xi'an",
    constructionYear: 1986,
    structureType: "Reinforced concrete frame",
    floorCount: 8,
    basementCount: 1,
    grossFloorArea: 12800,
    currentCondition:
      "Structure generally sound. Facade tiles spalling on south elevation. Roof waterproofing failed in sections. MEP systems obsolete. Interior partitions non-compliant with current fire codes.",
    heritageLevel: "none",
    createdAt: daysAgo(45),
    updatedAt: daysAgo(1),
  },
  {
    id: "bld-2",
    projectId: "proj-2",
    name: "Riverside Warehouse Building 3",
    address: "No. 15 Suzhou Creek Road, Putuo District, Shanghai",
    constructionYear: 1972,
    structureType: "Steel frame with brick infill",
    floorCount: 3,
    basementCount: 0,
    grossFloorArea: 15600,
    currentCondition: "Steel corrosion at ground level. Roof leaks. Partial floor load concerns.",
    heritageLevel: "local",
    createdAt: daysAgo(60),
    updatedAt: daysAgo(5),
  },
  {
    id: "bld-3",
    projectId: "proj-3",
    name: "Huangpu Lane Block 7",
    address: "Huangpu Lane, Tianhe District, Guangzhou",
    constructionYear: 1998,
    structureType: "Shear wall",
    floorCount: 12,
    basementCount: 1,
    grossFloorArea: 9200,
    currentCondition: "Generally fair condition. Window seals failing. Elevator aging.",
    heritageLevel: "none",
    createdAt: daysAgo(20),
    updatedAt: daysAgo(2),
  },
  {
    id: "bld-4",
    projectId: "proj-4",
    name: "Nanjing Road Heritage Commercial",
    address: "128 Nanjing East Road, Gulou District, Nanjing",
    constructionYear: 1965,
    structureType: "Reinforced concrete frame",
    floorCount: 6,
    basementCount: 1,
    grossFloorArea: 7400,
    currentCondition: "Heritage facade requires careful restoration. Structural survey pending for mezzanine additions.",
    heritageLevel: "provincial",
    createdAt: daysAgo(120),
    updatedAt: daysAgo(1),
  },
];

export const mockDocuments: DocumentAsset[] = [
  {
    id: "doc-1",
    projectId: "proj-demo",
    name: "Original Structural Drawings (1986)",
    type: "pdf",
    fileUrl: "/samples/existing-condition-sample.pdf",
    fileSize: 4200000,
    mimeType: "application/pdf",
    category: "old_drawings",
    aiSummary: documentAISummaries["doc-1"]?.aiSummary ?? null,
    extractedText: documentAISummaries["doc-1"]?.extractedText ?? null,
    description: "Original reinforced concrete frame drawings from 1986 construction.",
    uploadedById: "user-1",
    createdAt: daysAgo(40),
    updatedAt: daysAgo(40),
  },
  {
    id: "doc-2",
    projectId: "proj-demo",
    name: "South Facade Survey Photos",
    type: "folder",
    fileUrl: "/uploads/demo/facade-survey/",
    fileSize: 28000000,
    mimeType: "application/zip",
    category: "survey_photos",
    aiSummary: documentAISummaries["doc-2"]?.aiSummary ?? null,
    extractedText: null,
    description: "Site survey photos documenting tile spalling and window conditions.",
    uploadedById: "user-3",
    createdAt: daysAgo(30),
    updatedAt: daysAgo(30),
  },
  {
    id: "doc-3",
    projectId: "proj-demo",
    name: "Structural Inspection Report 2024",
    type: "pdf",
    fileUrl: "/samples/existing-condition-sample.pdf",
    fileSize: 1800000,
    mimeType: "application/pdf",
    category: "structure_documents",
    aiSummary: documentAISummaries["doc-3"]?.aiSummary ?? null,
    extractedText: documentAISummaries["doc-3"]?.extractedText ?? null,
    description: "Third-party structural assessment from 2024.",
    uploadedById: "user-2",
    createdAt: daysAgo(25),
    updatedAt: daysAgo(25),
  },
  {
    id: "doc-4",
    projectId: "proj-demo",
    name: "MEP As-Built Drawings",
    type: "pdf",
    fileUrl: "/samples/existing-condition-sample.pdf",
    fileSize: 3100000,
    mimeType: "application/pdf",
    category: "mep_documents",
    aiSummary: documentAISummaries["doc-4"]?.aiSummary ?? null,
    extractedText: null,
    description: "Partial MEP as-built documentation from 2003 renovation.",
    uploadedById: "user-1",
    createdAt: daysAgo(35),
    updatedAt: daysAgo(35),
  },
  {
    id: "doc-5",
    projectId: "proj-demo",
    name: "Building History Archive",
    type: "pdf",
    fileUrl: "/samples/existing-condition-sample.pdf",
    fileSize: 890000,
    mimeType: "application/pdf",
    category: "historical_documents",
    aiSummary: documentAISummaries["doc-5"]?.aiSummary ?? null,
    extractedText: null,
    description: "Historical records of government office usage and prior renovations.",
    uploadedById: "user-1",
    createdAt: daysAgo(38),
    updatedAt: daysAgo(38),
  },
];

export const mockDiagnosis: DiagnosisItem[] = [
  {
    id: "diag-1",
    projectId: "proj-demo",
    insightId: "insight-7",
    title: "South facade tile spalling",
    category: "facade",
    severity: "high",
    status: "confirmed",
    description:
      "Approximately 35% of ceramic tiles on the south elevation show cracking, debonding, or complete loss. Risk of falling debris.",
    evidence: "Site survey photos (2026-05), visual inspection report",
    recommendation: "Full facade tile removal and replacement with new cladding system. Install safety netting during assessment.",
    relatedLocation: "South elevation, floors 2–7",
    requiresEngineerReview: false,
    createdAt: daysAgo(20),
    updatedAt: daysAgo(5),
  },
  {
    id: "diag-2",
    projectId: "proj-demo",
    title: "Roof waterproofing failure",
    category: "architecture",
    severity: "high",
    status: "confirmed",
    description: "Multiple areas of roof membrane deterioration causing interior water damage on top floor.",
    evidence: "Leakage photos, moisture mapping on 8F ceiling",
    recommendation: "Complete roof membrane replacement. Inspect and repair affected ceiling structures.",
    relatedLocation: "Roof level, 8F interior",
    createdAt: daysAgo(18),
    updatedAt: daysAgo(4),
  },
  {
    id: "diag-3",
    projectId: "proj-demo",
    insightId: "insight-8",
    title: "Obsolescent MEP systems",
    category: "mep",
    severity: "critical",
    status: "confirmed",
    description:
      "HVAC, electrical, and plumbing systems are beyond service life. No central air conditioning. Electrical panel capacity insufficient for cultural center loads.",
    evidence: "MEP as-built drawings (2003), site inspection notes",
    recommendation: "Full MEP replacement required. Conduct load calculation for new cultural program.",
    relatedLocation: "Building-wide",
    requiresEngineerReview: true,
    createdAt: daysAgo(15),
    updatedAt: daysAgo(3),
  },
  {
    id: "diag-4",
    projectId: "proj-demo",
    insightId: "insight-2",
    title: "Non-compliant fire egress",
    category: "fire_safety",
    severity: "critical",
    status: "under_review",
    description: "Current corridor widths and exit configurations do not meet code for assembly occupancy.",
    evidence: "Code review against GB 50016, measured corridor widths",
    recommendation: "Redesign egress paths. Consider additional stair core on east side.",
    relatedLocation: "All floors, core areas",
    requiresEngineerReview: true,
    createdAt: daysAgo(12),
    updatedAt: daysAgo(2),
  },
  {
    id: "diag-5",
    projectId: "proj-demo",
    title: "No accessible entrance or elevator",
    category: "accessibility",
    severity: "high",
    status: "identified",
    description: "Building lacks ramp access and elevator does not meet current accessibility standards.",
    evidence: "Site measurement, accessibility checklist",
    recommendation: "Add accessible ramp at main entrance. Replace or upgrade elevator cab and controls.",
    relatedLocation: "Ground floor entrance, elevator core",
    createdAt: daysAgo(10),
    updatedAt: daysAgo(1),
  },
  {
    id: "diag-6",
    projectId: "proj-demo",
    insightId: null,
    title: "Concrete carbonation at column bases",
    category: "structure",
    severity: "medium",
    status: "under_review",
    description: "Early signs of carbonation detected at ground floor column bases in basement parking area.",
    evidence: "Structural inspection report 2024, cover meter readings",
    recommendation: "Engineer to assess depth of carbonation. Plan protective coating or localized repair.",
    relatedLocation: "Basement B1, grid lines C-D/3-5",
    requiresEngineerReview: true,
    createdAt: daysAgo(8),
    updatedAt: daysAgo(1),
  },
  {
    id: "diag-7",
    projectId: "proj-demo",
    title: "Poor thermal envelope performance",
    category: "energy",
    severity: "medium",
    status: "identified",
    description: "Single-glazed windows and uninsulated walls result in high energy consumption.",
    evidence: "Energy audit preliminary data",
    recommendation: "Upgrade windows to double-glazed units. Consider external insulation with new facade.",
    relatedLocation: "Building envelope",
    createdAt: daysAgo(7),
    updatedAt: daysAgo(1),
  },
];

export const mockStrategies: RenovationStrategy[] = [
  {
    id: "strat-1",
    projectId: "proj-demo",
    name: "Light Renewal — Minimal Intervention",
    type: "light_renewal",
    summary: "Preserve existing layout with targeted repairs to facade, roof, and essential MEP upgrades.",
    designGoal: "Quick reopening with minimal spatial changes for basic cultural programming.",
    spatialStrategy: "Retain existing office partition layout. Convert largest rooms to exhibition and lecture spaces.",
    structuralStrategy: "Localized repairs only. No structural modifications.",
    facadeStrategy: "Repair and replace spalled tiles in matching pattern.",
    mepStrategy: "Upgrade electrical panel and HVAC in critical zones only.",
    costLevel: "low",
    scheduleLevel: "low",
    riskLevel: "low",
    designValueScore: 40,
    feasibilityScore: 88,
    preservationScore: 90,
    pros: ["Lowest cost", "Fastest timeline", "Minimal disruption"],
    cons: ["Does not address accessibility", "Limited program flexibility", "Energy performance remains poor"],
    recommendationReason: null,
    createdAt: daysAgo(10),
    updatedAt: daysAgo(2),
  },
  {
    id: "strat-2",
    projectId: "proj-demo",
    name: "Adaptive Reuse — Cultural Hub",
    type: "adaptive_reuse",
    summary: "Transform interior into open, flexible cultural spaces while preserving the concrete frame and adding a new facade identity.",
    designGoal: "Create a vibrant community cultural center with exhibition, library, and performance spaces.",
    spatialStrategy: "Remove non-structural partitions on floors 1–3 for open gallery. Create double-height reading room on 4F.",
    structuralStrategy: "Verify capacity for floor openings. Strengthen select beams for new loads.",
    facadeStrategy: "New perforated metal screen over existing structure. Replace all windows.",
    mepStrategy: "Complete MEP replacement with energy-efficient systems.",
    costLevel: "medium",
    scheduleLevel: "medium",
    riskLevel: "medium",
    designValueScore: 85,
    feasibilityScore: 72,
    preservationScore: 75,
    pros: ["Strong design value", "Meets program goals", "Improves energy performance"],
    cons: ["Moderate cost", "Requires structural verification", "Temporary relocation needed"],
    recommendationReason:
      "Best balance of preservation, program fit, and community impact. Aligns with owner's vision for a public cultural hub.",
    createdAt: daysAgo(8),
    updatedAt: daysAgo(1),
  },
  {
    id: "strat-3",
    projectId: "proj-demo",
    name: "Deep Recreation — Full Transformation",
    type: "deep_recreation",
    summary: "Comprehensive gut renovation with new vertical circulation, rooftop extension, and complete envelope replacement.",
    designGoal: "Maximize building potential as a landmark cultural destination.",
    spatialStrategy: "Full interior demolition. New atrium and vertical circulation core. Rooftop terrace addition.",
    structuralStrategy: "Major structural modifications including new core and rooftop load analysis.",
    facadeStrategy: "Complete new facade system with high-performance curtain wall.",
    mepStrategy: "All-new systems with smart building integration.",
    costLevel: "high",
    scheduleLevel: "high",
    riskLevel: "high",
    designValueScore: 95,
    feasibilityScore: 55,
    preservationScore: 40,
    pros: ["Maximum design potential", "Best long-term performance", "Landmark quality"],
    cons: ["Highest cost", "Longest schedule", "Highest construction risk"],
    recommendationReason: null,
    createdAt: daysAgo(8),
    updatedAt: daysAgo(1),
  },
];

export const mockIssues: SiteIssue[] = [
  {
    id: "issue-1",
    projectId: "proj-demo",
    title: "Falling tile debris on south sidewalk",
    category: "facade_damage",
    priority: "urgent",
    status: "open",
    location: "South elevation, 3F",
    description: "Several ceramic tiles have fallen onto the sidewalk. Safety barrier installed.",
    photoUrl: null,
    assignedToId: "user-3",
    aiDetected: true,
    relatedInsightId: "insight-7",
    dueDate: daysAgo(-3),
    createdAt: daysAgo(5),
    updatedAt: daysAgo(1),
  },
  {
    id: "issue-2",
    projectId: "proj-demo",
    title: "Roof leak in 8F conference room",
    category: "leakage",
    priority: "high",
    status: "in_progress",
    location: "8F, east wing",
    description: "Active water intrusion during rain. Ceiling tiles damaged.",
    photoUrl: null,
    assignedToId: "user-1",
    dueDate: daysAgo(-7),
    createdAt: daysAgo(12),
    updatedAt: daysAgo(2),
  },
  {
    id: "issue-3",
    projectId: "proj-demo",
    title: "Column base spalling in basement",
    category: "spalling",
    priority: "medium",
    status: "open",
    location: "B1 parking, grid C-4",
    description: "Concrete cover spalling exposing rebar. Needs structural engineer assessment.",
    photoUrl: null,
    assignedToId: "user-2",
    dueDate: daysAgo(-14),
    createdAt: daysAgo(8),
    updatedAt: daysAgo(3),
  },
  {
    id: "issue-4",
    projectId: "proj-demo",
    title: "As-built drawing mismatch — floor plate",
    category: "drawing_mismatch",
    priority: "medium",
    status: "open",
    location: "3F",
    description: "Original drawings show different corridor width than measured on site.",
    photoUrl: null,
    assignedToId: "user-1",
    dueDate: daysAgo(-10),
    createdAt: daysAgo(6),
    updatedAt: daysAgo(4),
  },
  {
    id: "issue-5",
    projectId: "proj-demo",
    title: "Blocked fire exit on ground floor",
    category: "fire_safety",
    priority: "high",
    status: "resolved",
    location: "Ground floor, west exit",
    description: "Storage items blocking emergency exit. Cleared and signed off.",
    photoUrl: null,
    assignedToId: "user-3",
    dueDate: daysAgo(2),
    createdAt: daysAgo(15),
    updatedAt: daysAgo(2),
  },
];

export const mockReports: Report[] = [
  {
    id: "report-1",
    projectId: "proj-demo",
    title: "Existing Condition Summary — May 2026",
    type: "existing_condition_report",
    content: "# Existing Condition Summary\n\n## Building Overview\n\n1986 reinforced concrete frame office building...",
    status: "ready",
    createdById: "user-1",
    generatedByAI: true,
    createdAt: daysAgo(10),
    updatedAt: daysAgo(5),
  },
];

export const mockConversations: AIConversation[] = [];

export function getProjectWithRelations(projectId: string): ProjectWithRelations | null {
  const project = mockProjects.find((p) => p.id === projectId);
  if (!project) return null;

  return {
    ...project,
    building: mockBuildings.find((b) => b.projectId === projectId) ?? null,
    buildingMemory: mockBuildingMemories.find((m) => m.projectId === projectId) ?? null,
    documents: mockDocuments.filter((d) => d.projectId === projectId),
    insights: mockAIInsights.filter((i) => i.projectId === projectId),
    tasks: mockAITasks.filter((t) => t.projectId === projectId),
    analysisRuns: mockAnalysisRuns.filter((r) => r.projectId === projectId),
    diagnosis: mockDiagnosis.filter((d) => d.projectId === projectId),
    strategies: mockStrategies.filter((s) => s.projectId === projectId),
    issues: mockIssues.filter((i) => i.projectId === projectId),
    reports: mockReports.filter((r) => r.projectId === projectId),
  };
}

export {
  mockAIInsights,
  mockAITasks,
  mockAnalysisRuns,
  mockBuildingMemories,
  mockSourceEvidence,
};

export function getDashboardStats(): DashboardStats {
  const activeStatuses = ["survey", "diagnosis", "strategy", "design", "construction"];
  const activeProjects = mockProjects.filter((p) => activeStatuses.includes(p.status));
  const highRiskProjects = mockProjects.filter(
    (p) => p.riskLevel === "high" || p.riskLevel === "critical"
  );
  const pendingIssues = mockIssues.filter(
    (i) => i.status === "open" || i.status === "in_progress"
  );

  const statusCounts = mockProjects.reduce(
    (acc, p) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    totalProjects: mockProjects.length,
    activeProjects: activeProjects.length,
    highRiskProjects: highRiskProjects.length,
    pendingIssues: pendingIssues.length,
    statusDistribution: Object.entries(statusCounts).map(([status, count]) => ({
      status: status as Project["status"],
      count,
    })),
  };
}

export function getUserById(id: string): User | undefined {
  return mockUsers.find((u) => u.id === id);
}

export function getRecentDiagnosis(limit = 5): DiagnosisItem[] {
  return [...mockDiagnosis]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, limit);
}

export function getRecentProjects(limit = 5): Project[] {
  return [...mockProjects]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, limit);
}

export function getAIInsightsSummary(): string {
  return "3 projects require immediate attention. The Xi'an demo project has 2 critical diagnosis items and 1 urgent site issue. Recommended focus: complete structural review and finalize adaptive reuse strategy.";
}

export const strategyMetrics: Record<string, import("@/types").StrategyComparisonMetrics> = {
  "strat-1": { cost: 25, schedule: 20, risk: 15, designValue: 40, constructionDifficulty: 20, preservationLevel: 90, feasibility: 88 },
  "strat-2": { cost: 55, schedule: 50, risk: 45, designValue: 85, constructionDifficulty: 55, preservationLevel: 75, feasibility: 72 },
  "strat-3": { cost: 90, schedule: 85, risk: 75, designValue: 95, constructionDifficulty: 90, preservationLevel: 40, feasibility: 55 },
};

export type MockStore = {
  projects: Project[];
  buildings: Building[];
  buildingMemories: import("@/types/ai").BuildingMemory[];
  documents: DocumentAsset[];
  insights: import("@/types/ai").AIInsight[];
  tasks: import("@/types/ai").AITask[];
  analysisRuns: import("@/types/ai").AIAnalysisRun[];
  evidence: import("@/types/ai").SourceEvidence[];
  diagnosis: DiagnosisItem[];
  strategies: RenovationStrategy[];
  issues: SiteIssue[];
  reports: Report[];
  conversations: AIConversation[];
  strategyVersions: import("@/types/ai").StrategyVersion[];
};

export function createMockStore(): MockStore {
  return {
    projects: [...mockProjects],
    buildings: [...mockBuildings],
    buildingMemories: [...mockBuildingMemories],
    documents: [...mockDocuments],
    insights: [...mockAIInsights],
    tasks: [...mockAITasks],
    analysisRuns: [...mockAnalysisRuns],
    evidence: [...mockSourceEvidence],
    diagnosis: [...mockDiagnosis],
    strategies: [...mockStrategies],
    issues: [...mockIssues],
    reports: [...mockReports],
    conversations: [...mockConversations],
    strategyVersions: [],
  };
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createAIMessage(role: AIMessage["role"], content: string): AIMessage {
  return { role, content, timestamp: new Date() };
}
