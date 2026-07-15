import type { ProjectWithRelations } from "@/types";
import type { BuildingMemory, AIAnalysisRun } from "@/types/ai";
import { withMockDelay, MOCK_MODEL, mockConfidence } from "../providers/utils";
import { isOpenAIConfigured } from "../openai-config";

export async function initializeBuildingMemory(
  project: ProjectWithRelations
): Promise<Omit<BuildingMemory, "id" | "createdAt" | "updatedAt">> {
  return withMockDelay(() => ({
    projectId: project.id,
    summary: `${project.name} is a ${project.constructionYear} ${project.structureType} building in ${project.location}, currently ${project.currentFunction.toLowerCase()} and targeted for conversion to ${project.targetFunction.toLowerCase()}.`,
    knownFacts: [
      `${project.floorCount}-story building, ${project.grossFloorArea.toLocaleString()} sqm GFA`,
      `Structure: ${project.structureType}`,
      `Renovation goal: ${project.renovationGoal}`,
    ],
    missingInformation: [
      "Complete structural as-built drawings",
      "Hazardous materials survey",
      "Fire engineering report for occupancy change",
    ],
    keyRisks: [`Overall project risk level: ${project.riskLevel}`],
    renovationPotential: "Preliminary assessment pending full document review.",
    designConstraints: [`Budget level: ${project.budgetLevel}`],
    ownerRequirements: [project.renovationGoal],
    importantDecisions: [],
    unresolvedQuestions: ["Preferred renovation strategy not yet finalized"],
    lastUpdatedByAI: new Date(),
  }));
}

function updateBuildingMemoryFromTemplate(
  project: ProjectWithRelations
): Omit<BuildingMemory, "id" | "createdAt" | "updatedAt"> {
  const diagnosis = project.diagnosis ?? [];
  const documents = project.documents ?? [];
  const critical = diagnosis.filter((d) => d.severity === "critical" || d.severity === "high");
  const analyzedDocs = documents.filter((d) => d.aiSummary);

  const documentFacts = analyzedDocs.slice(-4).map(
    (d) => `"${d.name}": ${d.aiSummary!.slice(0, 140)}${d.aiSummary!.length > 140 ? "…" : ""}`
  );

  return {
    projectId: project.id,
    summary: `Updated AI understanding of ${project.name}: ${critical.length} high/critical diagnosis items, ${documents.length} documents on file (${analyzedDocs.length} analyzed). Primary focus areas: ${[...new Set(critical.map((d) => d.category))].slice(0, 3).join(", ") || "survey completion"}.`,
    knownFacts: [
      `${project.constructionYear} ${project.structureType}, ${project.grossFloorArea.toLocaleString()} sqm`,
      `${diagnosis.length} diagnosis items recorded`,
      `${documents.length} documents uploaded (${analyzedDocs.length} AI-analyzed)`,
      project.building?.currentCondition ?? "Condition assessment in progress",
      ...documentFacts,
    ].filter(Boolean) as string[],
    missingInformation: [
      ...(documents.length < 8 ? ["Complete document archive"] : []),
      ...( !diagnosis.some((d) => d.category === "structure") ? ["Detailed structural survey"] : []),
      "Hazardous materials survey",
      "Verified egress capacity calculations",
      "Roof load assessment if rooftop program proposed",
    ],
    keyRisks: critical.slice(0, 5).map((d) => `${d.title} (${d.severity})`),
    renovationPotential:
      project.potentialScore >= 70
        ? "Strong adaptive reuse potential with careful phasing of MEP and code compliance upgrades."
        : "Moderate potential — further survey needed to confirm feasibility.",
    designConstraints: [
      `Budget: ${project.budgetLevel}`,
      `Target function: ${project.targetFunction}`,
      ...(project.building?.heritageLevel !== "none"
        ? [`Heritage level: ${project.building?.heritageLevel}`]
        : []),
    ],
    ownerRequirements: [project.renovationGoal],
    importantDecisions: [
      ...(project.strategies?.some((s) => s.recommendationReason)
        ? [`Strategy direction: ${project.strategies.find((s) => s.recommendationReason)?.name}`]
        : []),
    ],
    unresolvedQuestions: [
      "Can renovation be phased to allow partial occupancy?",
      "Is additional vertical circulation required?",
    ],
    lastUpdatedByAI: new Date(),
  };
}

export async function updateBuildingMemory(
  project: ProjectWithRelations
): Promise<Omit<BuildingMemory, "id" | "createdAt" | "updatedAt">> {
  if (isOpenAIConfigured()) {
    const { openAIService } = await import("../openai-service");
    return openAIService.synthesizeBuildingMemory(project);
  }

  return withMockDelay(() => updateBuildingMemoryFromTemplate(project), 1200);
}

export function getBuildingMemorySummary(memory: BuildingMemory): string {
  return memory.summary;
}

export function createAnalysisRun(
  projectId: string,
  analysisType: AIAnalysisRun["analysisType"],
  inputSummary: string,
  outputSummary: string,
  generatedItemCount: number
): Omit<AIAnalysisRun, "id" | "createdAt"> {
  return {
    projectId,
    analysisType,
    inputSummary,
    outputSummary,
    generatedItemCount,
    modelName: MOCK_MODEL,
    confidence: mockConfidence(0.85),
  };
}
