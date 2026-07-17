import type { DiagnosisItem, ProjectWithRelations } from "@/types";

const SEVERITY_ORDER: DiagnosisItem["severity"][] = [
  "critical",
  "high",
  "medium",
  "low",
];

function topFindings(items: DiagnosisItem[], limit = 4): DiagnosisItem[] {
  return [...items]
    .sort(
      (a, b) =>
        SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
    )
    .slice(0, limit);
}

function categoryBreakdown(items: DiagnosisItem[]): string {
  const counts = items.reduce(
    (acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  return Object.entries(counts)
    .map(([cat, count]) => `${cat.replace(/_/g, " ")} (${count})`)
    .join(", ");
}

/** Rule-based executive summary — always available without LangChain or OpenAI. */
export function buildRuleBasedExecutiveSummary(input: {
  project: ProjectWithRelations;
  diagnosisItems: DiagnosisItem[];
  expertSummary?: string;
}): string {
  const { project, diagnosisItems, expertSummary } = input;
  const critical = diagnosisItems.filter((d) => d.severity === "critical").length;
  const high = diagnosisItems.filter((d) => d.severity === "high").length;
  const engineerReview = diagnosisItems.filter((d) => d.requiresEngineerReview).length;
  const findings = topFindings(diagnosisItems);

  const lines = [
    `**${project.name}** (${project.code}) — building diagnosis executive summary.`,
    "",
    `The ${project.constructionYear} ${project.structureType.toLowerCase()} ${project.buildingType.toLowerCase()} in ${project.location} is targeted for conversion from ${project.currentFunction.toLowerCase()} to ${project.targetFunction.toLowerCase()}. Health ${project.healthScore}/100, potential ${project.potentialScore}/100, overall risk **${project.riskLevel}**.`,
    "",
    `**Assessment scope:** ${diagnosisItems.length} diagnosis items across ${categoryBreakdown(diagnosisItems) || "multiple disciplines"}. ${critical + high} high/critical findings; ${engineerReview} item(s) flagged for licensed engineer review.`,
  ];

  if (expertSummary?.trim()) {
    lines.push("", `**Expert agent coverage:** ${expertSummary.trim()}.`);
  }

  if (findings.length > 0) {
    lines.push("", "**Priority findings:**");
    for (const item of findings) {
      lines.push(
        `- **${item.title}** [${item.category}/${item.severity}]: ${item.description.slice(0, 160)}${item.description.length > 160 ? "…" : ""}`
      );
    }
  }

  lines.push(
    "",
    "**Recommended next steps:** (1) Resolve critical structural and fire-life-safety gaps before schematic design; (2) Commission missing surveys referenced in diagnosis; (3) Align renovation strategy selection with compliance remediation priorities; (4) Schedule multidisciplinary design review once surveys are complete."
  );

  return lines.join("\n");
}

export function diagnosisSummaryUsesAI(options: {
  langChainEnabled: boolean;
  openAIConfigured: boolean;
}): boolean {
  return options.langChainEnabled || options.openAIConfigured;
}
