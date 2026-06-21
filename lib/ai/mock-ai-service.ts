import type { AIService, ProjectContext } from "./types";
import type {
  DiagnosisItem,
  ProjectWithRelations,
  RenovationStrategy,
  ReportType,
  SiteIssue,
} from "@/types";
import type { AIMessage } from "@/types";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class MockAIService implements AIService {
  async generateDiagnosis(
    project: ProjectWithRelations
  ): Promise<Omit<DiagnosisItem, "id" | "projectId" | "createdAt" | "updatedAt">[]> {
    await delay(1200);

    return [
      {
        title: "Interior partition non-compliance",
        category: "fire_safety",
        severity: "medium",
        status: "identified",
        description: `Existing office partitions in ${project.name} may not meet current fire compartmentation requirements for assembly occupancy.`,
        evidence: "AI analysis based on building type conversion from office to cultural center",
        recommendation: "Conduct fire engineering review of partition types and propose upgrades.",
        relatedLocation: "Floors 2–6 interior partitions",
      },
      {
        title: "Ground floor ceiling height limitation",
        category: "architecture",
        severity: "low",
        status: "identified",
        description: "Ground floor ceiling height of 2.8m may limit exhibition display options for large installations.",
        evidence: "Typical floor-to-floor height for 1986 office buildings",
        recommendation: "Evaluate selective slab openings or raised floor systems for gallery spaces.",
        relatedLocation: "Ground floor",
      },
      {
        title: "Potential asbestos in floor finishes",
        category: "operation",
        severity: "high",
        status: "identified",
        description: "Buildings of this era commonly contain asbestos in vinyl floor tiles and mastic. Survey required before demolition.",
        evidence: "Construction year 1986, typical material practices",
        recommendation: "Commission hazardous materials survey before any interior demolition work.",
        relatedLocation: "All floors",
      },
    ];
  }

  async generateRenovationStrategies(
    project: ProjectWithRelations,
    diagnosisItems: DiagnosisItem[]
  ): Promise<
    Omit<RenovationStrategy, "id" | "projectId" | "createdAt" | "updatedAt">[]
  > {
    await delay(1500);

    const criticalCount = diagnosisItems.filter(
      (d) => d.severity === "critical" || d.severity === "high"
    ).length;

    const target = project.targetFunction.toLowerCase();
    const budgetNote =
      project.budgetLevel === "low"
        ? "Optimized for limited budget with phased implementation."
        : "Full program delivery within standard renovation budget.";

    return [
      {
        name: "Light Intervention — 轻介入更新",
        type: "light_renewal",
        summary: `Preserve existing layout with targeted repairs to facade, roof, and essential MEP upgrades for ${project.name}. ${budgetNote}`,
        designGoal: `Quick reopening with minimal spatial changes for basic ${target} programming.`,
        spatialStrategy: "Retain existing partition layout. Convert largest rooms to primary program spaces.",
        structuralStrategy: "Localized repairs only. No structural modifications.",
        facadeStrategy: "Repair and refresh existing facade. Replace windows in critical zones.",
        mepStrategy: "Upgrade electrical panel and HVAC in program-critical zones only.",
        costLevel: "low",
        scheduleLevel: "low",
        riskLevel: "low",
        pros: ["Lowest cost", "Fastest timeline", "Maximum preservation of existing structure"],
        cons: ["Limited program flexibility", "May not meet full accessibility requirements", "Energy performance remains moderate"],
        recommendationReason: null,
      },
      {
        name: "Medium Reconfiguration — 中度功能重组",
        type: "adaptive_reuse",
        summary: `Transform interior into open, flexible spaces for ${target} while preserving the ${project.structureType.toLowerCase()} and adding a new facade identity.`,
        designGoal: `Create a vibrant ${target} with exhibition, gathering, and flexible program spaces.`,
        spatialStrategy: "Remove non-structural partitions on lower floors for open gallery. Reconfigure circulation for public access.",
        structuralStrategy: "Verify capacity for selective floor openings. Strengthen select beams for new loads.",
        facadeStrategy: "New perforated screen or cladding over existing structure. Replace all windows.",
        mepStrategy: "Complete MEP replacement with energy-efficient systems.",
        costLevel: "medium",
        scheduleLevel: "medium",
        riskLevel: "medium",
        pros: ["Strong design value", "Meets program goals", "Improves energy performance"],
        cons: ["Moderate cost", "Requires structural verification", "Temporary relocation during construction"],
        recommendationReason:
          criticalCount >= 2 || project.budgetLevel !== "low"
            ? `Best balance of preservation, program fit, and feasibility for ${target}. Aligns with owner's renovation vision.`
            : project.budgetLevel === "low"
              ? "Recommended when budget allows phased medium intervention after light-renewal compliance work."
              : null,
      },
      {
        name: "Deep Recreation — 深度再造",
        type: "deep_recreation",
        summary: `Comprehensive transformation of ${project.name} with new vertical circulation, potential rooftop extension, and complete envelope replacement.`,
        designGoal: `Maximize building potential as a landmark ${target} destination.`,
        spatialStrategy: "Full interior reconfiguration. New atrium and vertical circulation core. Rooftop terrace addition if structurally feasible.",
        structuralStrategy: "Major structural modifications including new core and rooftop load analysis.",
        facadeStrategy: "Complete new facade system with high-performance envelope.",
        mepStrategy: "All-new systems with smart building integration.",
        costLevel: "high",
        scheduleLevel: "high",
        riskLevel: "high",
        pros: ["Maximum design potential", "Best long-term performance", "Landmark-quality outcome"],
        cons: ["Highest cost", "Longest schedule", "Highest construction and permitting risk"],
        recommendationReason: null,
      },
    ];
  }

  async generateReport(
    project: ProjectWithRelations,
    diagnosisItems: DiagnosisItem[],
    strategies: RenovationStrategy[],
    issues: SiteIssue[],
    reportType: ReportType
  ): Promise<{ title: string; content: string }> {
    await delay(1000);

    const date = new Date().toISOString().split("T")[0];
    const openIssues = issues.filter((i) => i.status === "open" || i.status === "in_progress");

    const templates: Record<ReportType, { title: string; content: string }> = {
      existing_condition_report: {
        title: `Existing Condition Report — ${project.name}`,
        content: `# Existing Condition Report

**Project:** ${project.name} (${project.code})
**Location:** ${project.location}
**Date:** ${date}
**Prepared by:** Recrete Platform

---

## 1. Executive Summary

This report summarizes the existing condition of ${project.name}, a ${project.constructionYear} ${project.structureType} ${project.buildingType.toLowerCase()} located in ${project.location}.

The building is currently ${project.currentFunction.toLowerCase()} and targeted for conversion to ${project.targetFunction.toLowerCase()}.

**Health Score:** ${project.healthScore}/100 | **Potential Score:** ${project.potentialScore}/100 | **Risk Level:** ${project.riskLevel}

## 2. Building Overview

| Attribute | Value |
|-----------|-------|
| Construction Year | ${project.constructionYear} |
| Structure Type | ${project.structureType} |
| Floor Count | ${project.floorCount} |
| Gross Floor Area | ${project.grossFloorArea.toLocaleString()} sqm |
| Original Function | ${project.originalFunction} |
| Current Function | ${project.currentFunction} |
| Target Function | ${project.targetFunction} |

## 3. Current Condition

${project.building?.currentCondition ?? "Condition assessment pending."}

## 4. Key Findings

${diagnosisItems.length > 0 ? diagnosisItems.map((d, i) => `${i + 1}. **${d.title}** (${d.category}, ${d.severity}): ${d.description}`).join("\n\n") : "No diagnosis items recorded yet."}

## 5. Open Site Issues

${openIssues.length > 0 ? openIssues.map((i) => `- **${i.title}** [${i.priority}] — ${i.location ?? "Location TBD"}`).join("\n") : "No open site issues."}

## 6. Recommendations

1. Complete structural assessment before schematic design
2. Commission hazardous materials survey
3. Update MEP load calculations for new program
4. Address urgent site issues before construction mobilization

---
*Generated by Recrete AI — ${date}*`,
      },
      diagnosis_report: {
        title: `Building Diagnosis Report — ${project.name}`,
        content: `# Building Diagnosis Report

**Project:** ${project.name} | **Date:** ${date}

## Summary

Total diagnosis items: **${diagnosisItems.length}**
Critical/High severity: **${diagnosisItems.filter((d) => d.severity === "critical" || d.severity === "high").length}**

## Diagnosis Items by Category

${Object.entries(
  diagnosisItems.reduce(
    (acc, d) => {
      acc[d.category] = acc[d.category] ?? [];
      acc[d.category].push(d);
      return acc;
    },
    {} as Record<string, DiagnosisItem[]>
  )
)
  .map(
    ([cat, items]) =>
      `### ${cat.replace(/_/g, " ").toUpperCase()}\n\n${items.map((d) => `- **${d.title}** [${d.severity}] — ${d.description}\n  - *Recommendation:* ${d.recommendation ?? "TBD"}`).join("\n\n")}`
  )
  .join("\n\n")}

---
*Generated by Recrete AI — ${date}*`,
      },
      renovation_strategy_report: {
        title: `Renovation Strategy Report — ${project.name}`,
        content: `# Renovation Strategy Report

**Project:** ${project.name} | **Date:** ${date}
**Renovation Goal:** ${project.renovationGoal}

## Strategies Evaluated

${strategies.map((s, i) => `### ${i + 1}. ${s.name}

**Type:** ${s.type.replace(/_/g, " ")}
**Summary:** ${s.summary}

| Metric | Level |
|--------|-------|
| Cost | ${s.costLevel} |
| Schedule | ${s.scheduleLevel} |
| Risk | ${s.riskLevel} |

**Pros:** ${s.pros.join("; ")}
**Cons:** ${s.cons.join("; ")}

${s.recommendationReason ? `**Recommendation:** ${s.recommendationReason}` : ""}
`).join("\n---\n\n")}

---
*Generated by Recrete AI — ${date}*`,
      },
      owner_presentation: {
        title: `Owner Presentation Outline — ${project.name}`,
        content: `# Owner Presentation Outline

**Project:** ${project.name}
**Date:** ${date}

## Slide 1: Project Vision
- Transform ${project.originalFunction.toLowerCase()} into ${project.targetFunction.toLowerCase()}
- Location: ${project.location}
- ${project.grossFloorArea.toLocaleString()} sqm opportunity

## Slide 2: Building Asset
- Built ${project.constructionYear}, ${project.structureType}
- Health: ${project.healthScore}/100 | Potential: ${project.potentialScore}/100

## Slide 3: Key Challenges
${diagnosisItems.slice(0, 4).map((d) => `- ${d.title}`).join("\n")}

## Slide 4: Recommended Strategy
${strategies.find((s) => s.recommendationReason)?.name ?? strategies[0]?.name ?? "Strategy evaluation in progress"}

## Slide 5: Next Steps
1. Approve preferred strategy direction
2. Commission detailed surveys
3. Begin schematic design phase
4. Stakeholder engagement plan

---
*Generated by Recrete AI — ${date}*`,
      },
      government_submission: {
        title: `Government Submission Draft — ${project.name}`,
        content: `# Urban Renewal Submission Draft

**Applicant:** ${project.name}
**Project Code:** ${project.code}
**Location:** ${project.location}
**Submission Date:** ${date}

## 1. Project Background
Renovation of existing ${project.buildingType.toLowerCase()} (${project.constructionYear}) for adaptive reuse as ${project.targetFunction.toLowerCase()}.

## 2. Public Benefit
- Revitalization of underutilized urban asset
- Community cultural and educational programming
- Preservation of existing structure reducing demolition waste

## 3. Technical Summary
- Structure: ${project.structureType}, ${project.floorCount} floors, ${project.grossFloorArea.toLocaleString()} sqm
- Risk assessment: ${project.riskLevel} risk level
- ${diagnosisItems.length} diagnosis items identified, ${openIssues.length} open site issues

## 4. Compliance Considerations
- Fire safety upgrade required for occupancy change
- Accessibility improvements planned
- Heritage impact: ${project.building?.heritageLevel ?? "none"}

---
*Generated by Recrete AI — ${date}*`,
      },
      site_issue_report: {
        title: `Site Issue Report — ${project.name}`,
        content: `# Site Issue Report

**Project:** ${project.name} | **Date:** ${date}
**Total Issues:** ${issues.length} | **Open:** ${openIssues.length}

## Open Issues

${openIssues.map((i) => `### ${i.title}
- **Category:** ${i.category}
- **Priority:** ${i.priority}
- **Status:** ${i.status}
- **Location:** ${i.location ?? "TBD"}
- ${i.description}
`).join("\n")}

## Resolved Issues

${issues.filter((i) => i.status === "resolved" || i.status === "closed").map((i) => `- ${i.title} [${i.status}]`).join("\n") || "None"}

---
*Generated by Recrete AI — ${date}*`,
      },
      design_meeting_summary: {
        title: `Design Meeting Summary — ${project.name}`,
        content: `# Design Meeting Summary

**Project:** ${project.name} | **Date:** ${date}
**Status:** ${project.status}

## Discussion Topics
- Diagnosis review (${diagnosisItems.length} items)
- Strategy evaluation (${strategies.length} options)
- Site issues (${openIssues.length} open)

## Decisions
- Continue with adaptive reuse evaluation
- Commission asbestos survey before demolition

## Action Items
1. Structural engineer site visit
2. Upload missing MEP drawings
3. Stakeholder workshop for program requirements

---
*Generated by Recrete AI — ${date}*`,
      },
    };

    return templates[reportType];
  }

  async askProjectAssistant(
    projectContext: ProjectContext,
    messages: AIMessage[]
  ): Promise<string> {
    await delay(800);

    const lastMessage = messages[messages.length - 1]?.content.toLowerCase() ?? "";
    const { project } = projectContext;
    const diagnosis = projectContext.diagnosisItems ?? project.diagnosis ?? [];
    const strategies = projectContext.strategies ?? project.strategies ?? [];
    const issues = projectContext.issues ?? project.issues ?? [];
    const memory = projectContext.buildingMemory;
    const evidence = projectContext.evidence ?? [];

    if (lastMessage.includes("risk")) {
      if (memory?.keyRisks.length) {
        return `**Main risks for ${project.name}** (from Building Memory):\n\n${memory.keyRisks.map((r) => `• ${r}`).join("\n")}\n\nOverall project risk level is **${project.riskLevel}**. ${evidence.length} evidence records support current AI understanding.`;
      }
      const critical = diagnosis.filter((d) => d.severity === "critical" || d.severity === "high");
      return `**Main risks for ${project.name}:**\n\n${critical.map((d) => `• **${d.title}** (${d.category}, ${d.severity}): ${d.description.slice(0, 120)}...`).join("\n\n")}\n\nOverall project risk level is **${project.riskLevel}**. Priority actions: address ${issues.filter((i) => i.priority === "urgent").length} urgent site issues and complete structural review.`;
    }

    if (lastMessage.includes("missing") || lastMessage.includes("information")) {
      if (memory?.missingInformation.length) {
        return `**Missing information for ${project.name}** (from Building Memory):\n\n${memory.missingInformation.map((m, i) => `${i + 1}. ${m}`).join("\n")}\n\n${memory.summary}`;
      }
      const missing: string[] = [];
      if ((project.documents?.length ?? 0) < 5) missing.push("Complete document archive (as-built drawings, MEP records)");
      if (!diagnosis.some((d) => d.category === "structure")) missing.push("Detailed structural survey report");
      missing.push("Hazardous materials (asbestos) survey");
      missing.push("Geotechnical assessment for basement areas");
      missing.push("Energy audit baseline data");
      missing.push("Stakeholder requirements brief for cultural program");
      return `**Missing information for ${project.name}:**\n\n${missing.map((m, i) => `${i + 1}. ${m}`).join("\n")}\n\nCompleting these items will significantly improve diagnosis accuracy and strategy confidence.`;
    }

    if (lastMessage.includes("owner") || lastMessage.includes("summarize this project")) {
      return `**Owner Summary — ${project.name}**\n\n**Vision:** Transform ${project.originalFunction.toLowerCase()} into ${project.targetFunction.toLowerCase()}.\n\n**Asset:** ${project.constructionYear} ${project.structureType}, ${project.grossFloorArea.toLocaleString()} sqm in ${project.location}.\n\n**Scores:** Health ${project.healthScore}/100 · Potential ${project.potentialScore}/100 · AI Readiness ${project.aiReadinessScore}/100\n\n**Recommended direction:** ${strategies.find((s) => s.recommendationReason)?.name ?? "Strategy evaluation in progress"}`;
    }

    if (lastMessage.includes("agenda") || lastMessage.includes("presentation")) {
      return `**Client Presentation Outline — ${project.name}**\n\n1. Project vision and community benefit\n2. Building asset overview\n3. Key diagnosis findings (${diagnosis.length} items)\n4. Recommended strategy: ${strategies.find((s) => s.recommendationReason)?.name ?? "TBD"}\n5. Phasing and next steps`;
    }

    if (lastMessage.includes("generate three") || lastMessage.includes("three renovation")) {
      return strategies.length >= 3
        ? `**Three renovation strategies for ${project.name}:**\n\n${strategies.slice(0, 3).map((s, i) => `${i + 1}. **${s.name}** (${s.type})\n   Cost: ${s.costLevel} | Feasibility: ${s.feasibilityScore ?? "N/A"}/100\n   ${s.summary.slice(0, 100)}...`).join("\n\n")}`
        : `I can generate light renewal, adaptive reuse, and deep recreation strategies. Use Strategy Lab to run AI generation.`;
    }

    if (lastMessage.includes("strategy") || lastMessage.includes("recommend") || lastMessage.includes("feasible")) {
      const recommended = strategies.find((s) => s.recommendationReason);
      if (recommended) {
        return `**Recommended strategy: ${recommended.name}**\n\n${recommended.recommendationReason}\n\n**Summary:** ${recommended.summary}\n\n**Cost:** ${recommended.costLevel} | **Schedule:** ${recommended.scheduleLevel} | **Risk:** ${recommended.riskLevel}`;
      }
      return `Based on the project profile, I recommend evaluating the **Adaptive Reuse** approach as it best balances preservation of the ${project.constructionYear} concrete frame with the goal of creating a ${project.targetFunction.toLowerCase()}.`;
    }

    if (lastMessage.includes("next") || lastMessage.includes("should we do")) {
      return `**Recommended next actions for ${project.name}:**\n\n1. **Immediate:** Address urgent site issues (${issues.filter((i) => i.priority === "urgent" && i.status === "open").length} open)\n2. **This week:** Complete hazardous materials survey\n3. **This month:** Finalize renovation strategy selection\n4. **Next phase:** Begin schematic design with structural engineer\n5. **Ongoing:** Upload remaining as-built drawings to document archive`;
    }

    if (lastMessage.includes("meeting") || lastMessage.includes("summary")) {
      return `**Meeting Summary — ${project.name}**\n\n**Date:** ${new Date().toLocaleDateString()}\n**Status:** ${project.status}\n\n**Discussed:**\n• Current diagnosis findings (${diagnosis.length} items, ${diagnosis.filter((d) => d.severity === "critical").length} critical)\n• Strategy comparison (${strategies.length} options evaluated)\n• Site safety concerns (${issues.filter((i) => i.status === "open").length} open issues)\n\n**Decisions:**\n• Proceed with adaptive reuse strategy evaluation\n• Commission asbestos survey before interior work\n\n**Action Items:**\n• Structural engineer site visit — due next week\n• Upload missing MEP drawings\n• Schedule stakeholder workshop for program requirements`;
    }

    if (lastMessage.includes("structural")) {
      const structural = diagnosis.filter((d) => d.category === "structure");
      return `**Structural issues requiring engineer review:**\n\n${structural.length > 0 ? structural.map((d) => `• **${d.title}** [${d.severity}]\n  Location: ${d.relatedLocation ?? "TBD"}\n  ${d.description}`).join("\n\n") : "No structural diagnosis items yet. Recommend commissioning structural survey."}\n\n${issues.filter((i) => i.category === "spalling" || i.category === "structure_exposure").map((i) => `• Site issue: **${i.title}** at ${i.location}`).join("\n")}`;
    }

    if (lastMessage.includes("document") || lastMessage.includes("schematic")) {
      const analyzed = (projectContext.documents ?? project.documents ?? []).filter((d) => d.aiSummary);
      const evidenceNote =
        evidence.length > 0
          ? `\n\n**AI evidence on file:** ${evidence.length} extracted records from document analysis.`
          : "";
      return `**Documents required before schematic design:**\n\n1. Complete architectural as-built drawings (all floors)\n2. Structural drawings and latest inspection report\n3. MEP as-built with load calculations\n4. Hazardous materials survey report\n5. Survey photos and measured drawings\n6. Approved renovation strategy brief\n7. Program requirements document\n8. Code compliance checklist for target occupancy\n\nCurrently ${project.documents?.length ?? 0} documents uploaded (${analyzed.length} AI-analyzed). Priority: structural and MEP records.${evidenceNote}`;
    }

    if (memory) {
      return `I'm here to help with **${project.name}**. ${memory.summary}\n\n**Building Memory highlights:**\n• Known facts: ${memory.knownFacts.slice(0, 3).join("; ")}\n• Open gaps: ${memory.missingInformation.slice(0, 2).join("; ")}\n\nAsk about risks, missing information, strategies, next steps, or required documents.`;
    }

    return `I'm here to help with **${project.name}**. This ${project.constructionYear} ${project.buildingType.toLowerCase()} is in **${project.status}** phase with a health score of ${project.healthScore}/100.\n\nYou can ask me about risks, missing information, strategy recommendations, next steps, meeting summaries, structural issues, or required documents.`;
  }
}

export const mockAIService = new MockAIService();
