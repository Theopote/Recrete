import "server-only";

import type { ProjectWithRelations, DiagnosisItem } from "@/types";
import { complianceAgent } from "../agents/compliance-agent";
import { runComplianceEngine } from "./engine";
import type { ComplianceMeasurements } from "./types";
import { searchKnowledgeForProjectAsync } from "../knowledge/embedding-search";
import { isLangChainEnabled } from "../langchain/chains";
import { runComplianceHybridChain } from "../langchain/compliance-chain";

function dedupeDiagnosis(
  items: Omit<DiagnosisItem, "id" | "projectId" | "createdAt" | "updatedAt">[]
) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.title.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Rule engine first, then RAG + LLM for gaps (hybrid compliance reasoning).
 */
export async function generateComplianceDiagnosisHybrid(
  project: ProjectWithRelations,
  measurements?: ComplianceMeasurements
): Promise<Omit<DiagnosisItem, "id" | "projectId" | "createdAt" | "updatedAt">[]> {
  const checkResult = runComplianceEngine(project, { measurements });
  const ruleItems = await complianceAgent.generateComplianceDiagnosis(project, measurements);

  if (!isLangChainEnabled()) {
    return ruleItems;
  }

  const knowledge = await searchKnowledgeForProjectAsync(
    project,
    `${project.targetFunction} fire safety accessibility compliance GB code`,
    5
  );

  const codeHits = complianceAgent.searchCodeRequirements(project.targetFunction).slice(0, 6);
  const codeSnippets = codeHits
    .map((h) => `${h.code.code} ${h.code.name}: ${h.requirement.description}`)
    .join("\n");

  const llmItems = await runComplianceHybridChain({
    project,
    ruleChecks: checkResult.checks.map((c) => ({
      requirement: c.requirement,
      code: c.code,
      status: c.status,
      note: c.note,
      priority: c.priority,
    })),
    knowledge,
    codeSnippets,
  });

  return dedupeDiagnosis([...ruleItems, ...llmItems]);
}
