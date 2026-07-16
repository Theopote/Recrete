import type { AIService, ProjectContext } from "./types";
import type {
  DiagnosisItem,
  ProjectWithRelations,
  RenovationStrategy,
  ReportType,
  SiteIssue,
} from "@/types";
import type { AIMessage } from "@/types";
import { buildMockReportContent } from "./build-report-content";

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
      {
        title: "High baseline energy consumption",
        category: "energy",
        severity: "medium",
        status: "identified",
        description: `Pre-renovation EUI likely above climate benchmark for ${project.location}. Envelope and HVAC upgrades recommended.`,
        evidence: `Construction year ${project.constructionYear}, typical uninsulated envelope`,
        recommendation: "Run Energy Agent for simulation, green retrofit bundle, and ROI analysis.",
        relatedLocation: "Whole building envelope and MEP plant",
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
      {
        name: "Green Energy Retrofit — 绿色节能改造",
        type: "energy_retrofit",
        summary: `Envelope-first energy upgrade for ${project.name}: high-performance glazing, insulation, HVAC replacement, and optional rooftop PV with measurable ROI.`,
        designGoal: `Reduce operating energy by 30–40% while preserving existing spatial layout and structure.`,
        spatialStrategy: "Minimal spatial change. Focus on envelope and MEP plant upgrades with phased tenant coordination.",
        structuralStrategy: "No structural modifications unless rooftop PV ballast requires load check.",
        facadeStrategy: "External insulation with new high-performance windows. Target U-value compliance per GB 50189.",
        mepStrategy: "Replace aging HVAC with VRF/high-efficiency systems. LED lighting with smart controls.",
        costLevel: project.budgetLevel === "low" ? "medium" : "medium",
        scheduleLevel: "medium",
        riskLevel: "low",
        pros: [
          "Strong ROI and payback (typically 6–10 years)",
          "Low disruption to building use",
          "Eligible for green financing and subsidies",
        ],
        cons: [
          "Limited design transformation",
          "Requires accurate energy baseline data",
          "Savings depend on occupancy and tariffs",
        ],
        recommendationReason:
          project.renovationGoal.toLowerCase().includes("energy") ||
          project.renovationGoal.includes("节能") ||
          project.budgetLevel === "low"
            ? "Best fit when primary goal is operational cost reduction with limited capital for deep recreation."
            : null,
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
    return buildMockReportContent(project, diagnosisItems, strategies, issues, reportType);
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
    const knowledge = projectContext.knowledgeSnippets ?? [];

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
      const caseNote =
        knowledge.length > 0
          ? `\n\n**Reference from knowledge base:** ${knowledge[0].title} — ${knowledge[0].excerpt}`
          : "";
      if (recommended) {
        return `**Recommended strategy: ${recommended.name}**\n\n${recommended.recommendationReason}\n\n**Summary:** ${recommended.summary}\n\n**Cost:** ${recommended.costLevel} | **Schedule:** ${recommended.scheduleLevel} | **Risk:** ${recommended.riskLevel}${caseNote}`;
      }
      return `Based on the project profile, I recommend evaluating the **Adaptive Reuse** approach as it best balances preservation of the ${project.constructionYear} concrete frame with the goal of creating a ${project.targetFunction.toLowerCase()}.${caseNote}\n\nTo refine a strategy, say e.g. "Make option 2 more ambitious" or use Strategy Lab refine.`;
    }

    if (
      lastMessage.includes("comparable") ||
      lastMessage.includes("case") ||
      lastMessage.includes("案例") ||
      lastMessage.includes("historical")
    ) {
      if (knowledge.length > 0) {
        return `**Relevant reference cases & knowledge:**\n\n${knowledge.map((k, i) => `${i + 1}. **[${k.sourceType}] ${k.title}**\n   ${k.excerpt}`).join("\n\n")}`;
      }
      return `No closely matching cases found yet. Upload more project documents or specify building type and target function for better retrieval.`;
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
      const knowledgeNote =
        knowledge.length > 0
          ? `\n\n**Retrieved references:**\n${knowledge
              .slice(0, 4)
              .map((k) => `• [${k.sourceType}] ${k.title}: ${k.excerpt.slice(0, 100)}…`)
              .join("\n")}`
          : "";
      return `I'm here to help with **${project.name}**. ${memory.summary}\n\n**Building Memory highlights:**\n• Known facts: ${memory.knownFacts.slice(0, 3).join("; ")}\n• Open gaps: ${memory.missingInformation.slice(0, 2).join("; ")}${knowledgeNote}\n\nAsk about risks, strategies, comparable cases, or say "refine option 2 to be more ambitious".`;
    }

    if (knowledge.length > 0) {
      return `**${project.name}** — here's what I found in the knowledge base:\n\n${knowledge
        .slice(0, 4)
        .map((k, i) => `${i + 1}. **[${k.sourceType}] ${k.title}**\n   ${k.excerpt}`)
        .join("\n\n")}\n\nAsk a follow-up about risks, compliance, or strategy.`;
    }

    return `I'm here to help with **${project.name}**. This ${project.constructionYear} ${project.buildingType.toLowerCase()} is in **${project.status}** phase with a health score of ${project.healthScore}/100.\n\nYou can ask me about risks, missing information, strategy recommendations, next steps, meeting summaries, structural issues, or required documents.`;
  }
}

export const mockAIService = new MockAIService();
