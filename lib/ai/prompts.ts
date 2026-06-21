import type { ProjectWithRelations, ReportType } from "@/types";

export function buildDiagnosisPrompt(project: ProjectWithRelations): string {
  const buildingAge = new Date().getFullYear() - project.constructionYear;
  return `You are an expert building condition assessor specializing in existing building renovation.

Analyze the following existing building for comprehensive renovation diagnosis:

## Building Information
- Project: ${project.name}
- Location: ${project.location}
- Building Type: ${project.buildingType}
- Construction Year: ${project.constructionYear} (Age: ${buildingAge} years)
- Structure: ${project.structureType}
- Floors: ${project.floorCount}, GFA: ${project.grossFloorArea} sqm
- Current Function: ${project.currentFunction}
- Target Function: ${project.targetFunction}
- Renovation Goal: ${project.renovationGoal}
- Current Condition: ${project.building?.currentCondition ?? "To be assessed"}
- Budget Level: ${project.budgetLevel}

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
  diagnosisCount: number
): string {
  return `Generate renovation strategies for:

Project: ${project.name}
Target Function: ${project.targetFunction}
Renovation Goal: ${project.renovationGoal}
Budget Level: ${project.budgetLevel}
Risk Level: ${project.riskLevel}

Based on ${diagnosisCount} identified diagnosis items, propose multiple renovation strategies with cost, schedule, and risk assessments.`;
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

export const ASSISTANT_SUGGESTIONS = [
  "What are the main risks of this building?",
  "What information is missing?",
  "Generate three renovation strategies.",
  "Which strategy is most feasible?",
  "What should we do before schematic design?",
  "List structural issues requiring engineer review.",
  "Generate a client presentation outline.",
  "Generate a meeting agenda.",
  "Summarize this project for the owner.",
] as const;

export const CREATE_PROJECT_SUGGESTIONS = [
  "我有一栋 1986 年建成的混凝土框架办公楼，位于西安，原本是政府办公，现在想改成社区文化中心，预算有限，希望保留主体结构。",
  "1998 brick warehouse in Shanghai, vacant 5 years, convert to creative office with rooftop event space.",
  "1970s school building in Chengdu, need adaptive reuse as community library, medium budget.",
] as const;
