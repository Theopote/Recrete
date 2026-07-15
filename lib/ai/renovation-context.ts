import type { DiagnosisItem, ProjectWithRelations, RenovationStrategy } from "@/types";
import type { BuildingMemory, SourceEvidence } from "@/types/ai";

export interface RenovationContext {
  project: ProjectWithRelations;
  evidence: SourceEvidence[];
}

export function buildRenovationContext(
  project: ProjectWithRelations,
  evidence: SourceEvidence[] = []
): RenovationContext {
  return { project, evidence };
}

function analyzedDocuments(project: ProjectWithRelations) {
  return (project.documents ?? []).filter((d) => d.aiSummary?.trim());
}

export function formatDocumentAnalysisSection(project: ProjectWithRelations): string {
  const docs = analyzedDocuments(project);
  if (docs.length === 0) {
    return "## Uploaded Document Analysis\nNo AI-analyzed documents yet. Base assessment on building metadata and typical conditions for building age/type.";
  }

  const lines = docs.slice(0, 8).map((d, i) => {
    const summary = d.aiSummary!.slice(0, 420);
    const suffix = d.aiSummary!.length > 420 ? "…" : "";
    return `${i + 1}. **${d.name}** (${d.category})\n   ${summary}${suffix}`;
  });

  return `## Uploaded Document Analysis (${docs.length} analyzed)\n${lines.join("\n\n")}`;
}

export function formatEvidenceSection(evidence: SourceEvidence[]): string {
  if (evidence.length === 0) {
    return "## Site & Drawing Evidence\nNo structured evidence records yet.";
  }

  const lines = evidence.slice(0, 10).map((e, i) => {
    const loc = e.locationLabel ? ` @ ${e.locationLabel}` : "";
    const quote = (e.quote ?? "").slice(0, 280);
    return `${i + 1}. [${e.sourceType}${loc}] ${quote}`;
  });

  return `## Site & Drawing Evidence\n${lines.join("\n")}`;
}

export function formatDiagnosisForRenovation(
  items: DiagnosisItem[],
  limit = 14
): string {
  if (items.length === 0) {
    return "## Diagnosis Findings\nNo formal diagnosis items yet.";
  }

  const lines = items.slice(0, limit).map((d, i) => {
    return `${i + 1}. [${d.category}/${d.severity}] **${d.title}**\n   ${d.description.slice(0, 320)}\n   Evidence: ${d.evidence ?? "Assessment-based"}\n   Recommendation: ${d.recommendation ?? "TBD"}`;
  });

  return `## Diagnosis Findings (${items.length} total)\n${lines.join("\n\n")}`;
}

export function formatBuildingMemorySection(memory: BuildingMemory | null | undefined): string {
  if (!memory) return "";

  return `## Current Building Memory
Summary: ${memory.summary}
Known facts: ${memory.knownFacts.slice(0, 6).join("; ") || "None"}
Key risks: ${memory.keyRisks.slice(0, 5).join("; ") || "None"}
Missing information: ${memory.missingInformation.slice(0, 5).join("; ") || "None"}
Design constraints: ${memory.designConstraints.join("; ") || "None"}`;
}

export function formatStrategiesSection(strategies: RenovationStrategy[]): string {
  if (strategies.length === 0) return "";

  const lines = strategies.slice(0, 4).map(
    (s, i) =>
      `${i + 1}. ${s.name} (${s.type}) — ${s.summary.slice(0, 200)}`
  );
  return `## Existing Strategies\n${lines.join("\n")}`;
}

export function formatRenovationContextBlock(
  ctx: RenovationContext,
  options?: {
    diagnosis?: DiagnosisItem[];
    includeMemory?: boolean;
    includeStrategies?: boolean;
  }
): string {
  const { project, evidence } = ctx;
  const sections = [
    formatDocumentAnalysisSection(project),
    formatEvidenceSection(evidence),
  ];

  if (options?.diagnosis) {
    sections.push(formatDiagnosisForRenovation(options.diagnosis));
  }

  if (options?.includeMemory !== false) {
    const memoryBlock = formatBuildingMemorySection(project.buildingMemory);
    if (memoryBlock) sections.push(memoryBlock);
  }

  if (options?.includeStrategies && project.strategies?.length) {
    sections.push(formatStrategiesSection(project.strategies));
  }

  return sections.join("\n\n");
}

export function formatProjectBasics(project: ProjectWithRelations): string {
  const buildingAge = new Date().getFullYear() - project.constructionYear;
  return [
    `- Project: ${project.name} (${project.code})`,
    `- Location: ${project.location}`,
    `- Building: ${project.buildingType}, built ${project.constructionYear} (${buildingAge} years)`,
    `- Structure: ${project.structureType}, ${project.floorCount} floors, ${project.grossFloorArea.toLocaleString()} m² GFA`,
    `- Function change: ${project.currentFunction} → ${project.targetFunction}`,
    `- Renovation goal: ${project.renovationGoal}`,
    `- Budget: ${project.budgetLevel}, Risk: ${project.riskLevel}`,
    `- Condition: ${project.building?.currentCondition ?? "To be assessed"}`,
    project.building?.heritageLevel && project.building.heritageLevel !== "none"
      ? `- Heritage level: ${project.building.heritageLevel}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");
}
