import type { ProjectWithRelations, ReportType } from "@/types";
import type { ProjectAIContext } from "@/types/ai";
import { formatProjectBasics } from "./renovation-context";

export function buildDiagnosisPrompt(
  project: ProjectWithRelations,
  renovationContextBlock?: string
): string {
  const buildingAge = new Date().getFullYear() - project.constructionYear;
  const contextSection = renovationContextBlock
    ? `\n\n## Project Evidence & Document Analysis (PRIORITY — ground diagnosis in these facts when available)\n${renovationContextBlock}`
    : "";

  return `You are an expert building condition assessor specializing in existing building renovation in China.

Analyze the following existing building for comprehensive renovation diagnosis.

## Building Information
${formatProjectBasics(project)}
- Building Age Priority: ${buildingAge > 30 ? "HIGH — over 30 years, expect age-related deterioration" : "Monitor periodically"}
- Function Change: ${project.currentFunction !== project.targetFunction ? "YES — verify load, egress, and MEP for new occupancy" : "Same function — verify if intensifying use"}${contextSection}

## Analysis Requirements
Generate detailed diagnosis items across ALL relevant categories:

1. **Structure** - Focus on:
   - Age-related deterioration (${buildingAge > 30 ? 'HIGH PRIORITY - building over 30 years old' : 'monitor periodically'})
   - Load capacity for function change (${project.currentFunction !== project.targetFunction ? 'REQUIRED - function conversion detected' : 'verify if intensifying use'})
   - Seismic performance per current codes
   - Foundation and structural system integrity

2. **Architecture** - Consider:
   - Spatial layout suitability for target function
   - Ceiling heights, natural lighting
   - Circulation patterns
   - Envelope condition

3. **Facade** - Examine:
   - Window performance and energy efficiency
   - Facade material deterioration
   - Waterproofing integrity
   - Aesthetic renewal opportunities

4. **MEP (Mechanical, Electrical, Plumbing)** - Assess:
   - System capacity for new function
   - Equipment age and efficiency
   - Compliance with current codes
   - Upgrade requirements

5. **Fire Safety** - Verify:
   - Fire compartmentation for occupancy change
   - Egress capacity and stairway widths
   - Fire protection systems
   - Interior finish compliance

6. **Accessibility** - Check:
   - Barrier-free access requirements (${project.targetFunction.includes('公共') || project.targetFunction.toLowerCase().includes('public') ? 'MANDATORY for public buildings' : 'recommended'})
   - Elevator and ramp provision
   - Accessible toilet facilities

7. **Energy** - Evaluate:
   - Building envelope thermal performance
   - HVAC system efficiency
   - Opportunities for green renovation

8. **Heritage** (if applicable) - Note:
   - Heritage protection requirements
   - Character-defining elements to preserve
   - Intervention strategies

## Output Format
For each diagnosis item, provide:
- Specific, actionable title
- Appropriate category
- Severity level (low/medium/high/critical)
- Detailed description with technical reasoning
- Evidence or assessment basis
- Professional recommendation
- Specific location if applicable
- Whether structural engineer review is required

Prioritize items that are:
- Critical for safety
- Required for code compliance
- Essential for function conversion
- Age-related deterioration

Generate 6-12 diverse diagnosis items covering multiple categories. Be specific and professional.`;
}

export function buildStrategyPrompt(
  project: ProjectWithRelations,
  diagnosisItems: { title: string; severity: string; category: string; description: string }[],
  renovationContextBlock?: string,
  briefConstraintsBlock?: string
): string {
  const diagnosisLines = diagnosisItems
    .slice(0, 14)
    .map((d) => `- [${d.severity}/${d.category}] ${d.title}: ${d.description.slice(0, 200)}`)
    .join("\n");

  const contextSection = renovationContextBlock
    ? `\n\n## Evidence & Document Grounding (strategies MUST respond to these facts)\n${renovationContextBlock}`
    : "";
  const briefSection = briefConstraintsBlock
    ? `\n\n## Owner Brief Constraints (MANDATORY)\n${briefConstraintsBlock}`
    : "";

  return `You are a senior architect specializing in adaptive reuse and existing building renovation in China.

Generate professionally credible renovation strategies grounded in project evidence — not generic templates.

## Project
${formatProjectBasics(project)}

## Diagnosis Context
${diagnosisLines || "No diagnosis items yet — infer typical risks from building age, function change, and documents."}${contextSection}${briefSection}

## Strategy Requirements
Propose exactly 3 strategies — one per intervention tier — using this unified schema:
1. **Light renewal** (type: \`light_renewal\`) — minimal structural change, MEP upgrade, envelope refresh
2. **Medium renovation** (type: \`medium_renovation\`) — spatial reconfiguration, selective structural work
3. **Deep recreation** (type: \`deep_recreation\`) — major structural/envelope transformation

Each strategy MUST include:
- \`summary\`, \`designGoal\`
- \`spatialStrategy\` — reference specific rooms/zones from the Drawing Knowledge Graph when provided (use room labels)
- \`structuralStrategy\`, \`facadeStrategy\`, \`mepStrategy\` — scoped to the tier (minimal / selective / comprehensive)
- \`costLevel\`, \`scheduleLevel\`, \`riskLevel\`
- \`pros[]\`, \`cons[]\` tied to THIS building
- Do NOT set \`recommendationReason\` — ranking engine selects the recommendation
- Strategies MUST explicitly satisfy owner brief constraints (program, objective, schedule, budget, and design constraints when present)

Use concrete renovation terminology (柱网, 功能置换, 消防分区, 无障碍, 节能改造) where appropriate.`;
}

export function buildReportPrompt(
  project: ProjectWithRelations,
  reportType: ReportType
): string {
  return `Generate a ${reportType.replace(/_/g, " ")} for project ${project.name} (${project.code}) at ${project.location}.`;
}

export function buildAssistantSystemPrompt(project: ProjectWithRelations): string {
  return `You are Recrete AI, an expert assistant for building renovation projects.
You are helping with project "${project.name}" — a ${project.buildingType} in ${project.location}.
Construction year: ${project.constructionYear}. Structure: ${project.structureType}.
Renovation goal: ${project.renovationGoal}
Current status: ${project.status}. Health score: ${project.healthScore}/100. Risk: ${project.riskLevel}.

Provide professional, concise advice for architects, engineers, and project managers working on existing building renovation.`;
}

export function buildAssistantSystemPromptFromContext(context: ProjectAIContext): string {
  const { project, buildingMemory, insights, evidence, knowledgeSnippets } = context;
  const base = buildAssistantSystemPrompt(project);

  const memorySection = buildingMemory
    ? `\n\n## Building Memory (last updated ${new Date(buildingMemory.lastUpdatedByAI).toLocaleDateString()})
Summary: ${buildingMemory.summary}
Known facts: ${buildingMemory.knownFacts.slice(0, 8).join("; ")}
Missing information: ${buildingMemory.missingInformation.join("; ")}
Key risks: ${buildingMemory.keyRisks.slice(0, 5).join("; ")}
Design constraints: ${buildingMemory.designConstraints.join("; ")}`
    : "";

  const insightSection =
    insights.length > 0
      ? `\n\n## AI Insights (${insights.length})
${insights
  .slice(0, 5)
  .map((i) => `- [${i.priority}] ${i.title}: ${i.summary}`)
  .join("\n")}`
      : "";

  const evidenceSection =
    evidence.length > 0
      ? `\n\n## Project Evidence (from document / site analysis — cite as [evidence])
${evidence
  .slice(0, 6)
  .map(
    (e, i) =>
      `- [evidence:${i + 1}] ${e.sourceType}${e.locationLabel ? ` @ ${e.locationLabel}` : ""}: ${e.quote?.slice(0, 160) ?? "record"}`
  )
  .join("\n")}`
      : "";

  const knowledgeSection =
    knowledgeSnippets && knowledgeSnippets.length > 0
      ? `\n\n## Retrieved Knowledge (RAG — cite with [source_type] when used)
${knowledgeSnippets
  .map(
    (k) =>
      `- [${k.sourceType}] ${k.title} (relevance ${(k.relevance * 100).toFixed(0)}%): ${k.excerpt}`
  )
  .join("\n")}

When answering, prefer retrieved knowledge and project evidence over general assumptions. Cite sources inline, e.g. [code], [case], [project_doc].`
      : "";

  return `${base}${memorySection}${insightSection}${evidenceSection}${knowledgeSection}`;
}

export const ASSISTANT_SUGGESTION_PAIRS = [
  { en: "What are the main risks of this building?", zh: "这栋建筑的主要风险有哪些？" },
  { en: "What information is missing?", zh: "还缺少哪些关键信息？" },
  { en: "Which strategy is most feasible?", zh: "哪个改造方案最可行？" },
  { en: "Show comparable renovation cases", zh: "有哪些可比的改造案例？" },
  { en: "Refine option 2 to be more ambitious", zh: "把方案 2 改得更进取一些" },
  { en: "What should we do before schematic design?", zh: "方案设计前还应完成哪些工作？" },
  { en: "List structural issues requiring engineer review.", zh: "列出需要结构工程师复核的问题。" },
  { en: "Generate a client presentation outline.", zh: "生成一份面向甲方的汇报提纲。" },
  { en: "Summarize this project for the owner.", zh: "为业主总结本项目要点。" },
] as const;

export const ASSISTANT_SUGGESTIONS = ASSISTANT_SUGGESTION_PAIRS.map((s) => s.en);

export const CREATE_PROJECT_SUGGESTIONS = [
  "我有一栋 1986 年建成的混凝土框架办公楼，位于西安，原本是政府办公，现在想改成社区文化中心，预算有限，希望保留主体结构。",
  "1998 brick warehouse in Shanghai, vacant 5 years, convert to creative office with rooftop event space.",
  "1970s school building in Chengdu, need adaptive reuse as community library, medium budget.",
] as const;
