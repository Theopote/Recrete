import type {
  DiagnosisItem,
  ProjectWithRelations,
  RenovationStrategy,
  SiteIssue,
} from "@/types";
import type { StrategyWithMetrics } from "@/types";
import type { ComplianceEngineReport } from "@/lib/ai/compliance/types";
import type { BilingualString } from "@/lib/i18n/bilingual";

function formatRemediation(remediation: BilingualString): string {
  return `${remediation.en}\n  *${remediation.zh}*`;
}

function strategyDetailBlock(strategy: RenovationStrategy): string {
  const profile = (strategy as StrategyWithMetrics).tierProfile;
  const lines = [
    `**Type:** ${strategy.type.replace(/_/g, " ")}`,
    `**Summary:** ${strategy.summary}`,
    "",
    "| Metric | Level |",
    "|--------|-------|",
    `| Cost | ${strategy.costLevel} |`,
    `| Schedule | ${strategy.scheduleLevel} |`,
    `| Risk | ${strategy.riskLevel} |`,
    "",
    `**Design goal:** ${strategy.designGoal}`,
    `**Spatial:** ${strategy.spatialStrategy}`,
    `**Structure:** ${strategy.structuralStrategy}`,
    `**Facade:** ${strategy.facadeStrategy}`,
    `**MEP:** ${strategy.mepStrategy}`,
    "",
    `**Pros:** ${strategy.pros.join("; ")}`,
    `**Cons:** ${strategy.cons.join("; ")}`,
  ];

  if (strategy.recommendationReason) {
    lines.push("", `**Ranking rationale:** ${strategy.recommendationReason}`);
  }

  if (profile) {
    lines.push(
      "",
      `### Tier profile — ${profile.tierLabel.en} / ${profile.tierLabel.zh}`,
      `- Intervention depth: ${profile.interventionDepth}`,
      `- Preservation: ${profile.preservationPosture}`,
      `- Spatial summary: ${profile.spatialSummary}`,
      `- Structural scope: ${profile.structuralScope}`,
      `- Envelope scope: ${profile.envelopeScope}`,
      `- MEP scope: ${profile.mepScope}`
    );

    if (profile.spatialLinks.length > 0) {
      lines.push("", "**Spatial links (drawing graph):**");
      for (const link of profile.spatialLinks.slice(0, 8)) {
        lines.push(
          `- **${link.roomLabel}** (${link.intervention}): ${link.rationale}`
        );
      }
    }

    if (profile.diagnosisResponses.length > 0) {
      lines.push("", "**Diagnosis responses:**");
      for (const response of profile.diagnosisResponses.slice(0, 6)) {
        lines.push(`- ${response}`);
      }
    }
  }

  return lines.join("\n");
}

function complianceRemediationSection(report: ComplianceEngineReport): string {
  const actionable = report.checks.filter(
    (c) =>
      c.status === "non_compliant" ||
      c.status === "requires_verification"
  );

  const lines = [
    "## Compliance remediation (方案条件化)",
    "",
    `Overall compliance: **${report.overallCompliance}** — ${report.summary.nonCompliant} non-compliant, ${report.summary.requiresVerification} require verification (${report.summary.total} checks evaluated).`,
    "",
  ];

  if (actionable.length === 0) {
    lines.push("No open compliance gaps for the selected strategy context.");
    return lines.join("\n");
  }

  lines.push("### Priority checks & remediation");
  for (const check of actionable.slice(0, 12)) {
    lines.push(
      "",
      `#### ${check.requirement}`,
      `- **Code:** ${check.code} §${check.section} | **Status:** ${check.status} | **Priority:** ${check.priority}`,
      `- **Note:** ${check.note}`,
      check.remediation
        ? `- **Remediation:**\n  ${formatRemediation(check.remediation)}`
        : `- **Remediation:** Engage licensed reviewer for ${check.category} compliance.`
    );
  }

  if (report.criticalIssues.length > 0) {
    lines.push("", "### Critical issues");
    for (const issue of report.criticalIssues.slice(0, 6)) {
      lines.push(`- ${issue.en} / ${issue.zh}`);
    }
  }

  if (report.recommendations.length > 0) {
    lines.push("", "### Consolidated recommendations");
    for (const rec of report.recommendations.slice(0, 8)) {
      lines.push(`- ${rec.en} / ${rec.zh}`);
    }
  }

  return lines.join("\n");
}

function alternateStrategiesBrief(
  selected: RenovationStrategy,
  all: RenovationStrategy[]
): string {
  const others = all.filter((s) => s.id !== selected.id);
  if (others.length === 0) return "";

  return [
    "## Other strategies considered",
    "",
    ...others.map(
      (s) =>
        `- **${s.name}** (${s.type}): cost ${s.costLevel}, schedule ${s.scheduleLevel}, risk ${s.riskLevel} — ${s.summary.slice(0, 120)}${s.summary.length > 120 ? "…" : ""}`
    ),
  ].join("\n");
}

export function buildStrategyConditionedReportContent(input: {
  project: ProjectWithRelations;
  selectedStrategy: RenovationStrategy;
  allStrategies: RenovationStrategy[];
  diagnosisItems: DiagnosisItem[];
  issues: SiteIssue[];
  complianceReport: ComplianceEngineReport;
}): { title: string; content: string } {
  const { project, selectedStrategy, allStrategies, diagnosisItems, issues, complianceReport } =
    input;
  const date = new Date().toISOString().split("T")[0];
  const openIssues = issues.filter(
    (i) => i.status === "open" || i.status === "in_progress"
  );

  const content = `# Renovation Strategy Report — ${selectedStrategy.name}

**Project:** ${project.name} (${project.code}) | **Date:** ${date}
**Renovation goal:** ${project.renovationGoal}
**Selected strategy:** ${selectedStrategy.name}

---

## 1. Executive summary

This report is conditioned on the **${selectedStrategy.name}** strategy (${selectedStrategy.type.replace(/_/g, " ")}). It integrates project diagnosis (${diagnosisItems.length} items), site issues (${openIssues.length} open), and compliance remediation paths required to deliver this option.

${selectedStrategy.recommendationReason ? `**Why this strategy:** ${selectedStrategy.recommendationReason}` : ""}

---

## 2. Selected strategy profile

${strategyDetailBlock(selectedStrategy)}

---

## 3. Diagnosis alignment

${diagnosisItems.length > 0
    ? diagnosisItems
        .slice(0, 8)
        .map(
          (d, i) =>
            `${i + 1}. **${d.title}** [${d.severity}]: ${d.description.slice(0, 140)}${d.description.length > 140 ? "…" : ""}`
        )
        .join("\n")
    : "No diagnosis items on record."}

---

${complianceRemediationSection(complianceReport)}

---

${alternateStrategiesBrief(selectedStrategy, allStrategies)}

---

## 5. Implementation next steps

1. Confirm owner approval of **${selectedStrategy.name}** direction
2. Close critical compliance gaps listed above before permit submission
3. Commission surveys tied to \`requires_verification\` checks
4. Update cost and schedule models after remediation scope is frozen

---
*Generated by Recrete AI — strategy-conditioned report — ${date}*`;

  return {
    title: `Renovation Strategy Report — ${project.name} — ${selectedStrategy.name}`,
    content,
  };
}

/** Append strategy + compliance sections to an existing report skeleton. */
export function appendStrategyConditionedSections(
  baseContent: string,
  selectedStrategy: RenovationStrategy,
  complianceReport: ComplianceEngineReport
): string {
  return [
    baseContent,
    "",
    "---",
    "",
    "## Selected strategy (方案条件化)",
    "",
    strategyDetailBlock(selectedStrategy),
    "",
    complianceRemediationSection(complianceReport),
  ].join("\n");
}

export const REPORT_TYPES_WITH_STRATEGY = [
  "renovation_strategy_report",
  "owner_presentation",
] as const;

export type StrategyConditionedReportType = (typeof REPORT_TYPES_WITH_STRATEGY)[number];

export function reportTypeNeedsStrategy(
  reportType: string
): reportType is StrategyConditionedReportType {
  return (REPORT_TYPES_WITH_STRATEGY as readonly string[]).includes(reportType);
}
