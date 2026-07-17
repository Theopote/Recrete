import "server-only";

import type { ProjectWithRelations } from "@/types";
import type { ComplianceCheck } from "./types";
import {
  findRegulationFactsForCheck,
  collectStructuredRegulationFacts,
  enrichComplianceEvidenceWithRegulations,
  formatStructuredRegulationsBlock,
  formatStructuredRegulationsForComplianceChain,
  type RegulationFactWithSource,
} from "./regulation-context";
import {
  formatWebSearchSnippets,
  isWebSearchConfigured,
  searchRegulationsOnline,
  type WebSearchResult,
} from "@/lib/ai/knowledge/web-search.server";

export async function enrichComplianceEvidenceWithWebSearch(
  baseEvidence: string,
  check: Pick<ComplianceCheck, "code" | "section" | "requirement" | "requirementZh" | "category">,
  facts: RegulationFactWithSource[]
): Promise<string> {
  const relevant = findRegulationFactsForCheck(check, facts);
  if (relevant.length > 0 || !isWebSearchConfigured()) {
    return enrichComplianceEvidenceWithRegulations(baseEvidence, check, facts);
  }

  const web = await searchRegulationsOnline({
    codeRef: check.code,
    section: check.section,
    requirement: check.requirementZh ?? check.requirement,
    category: check.category,
  });

  return enrichComplianceEvidenceWithRegulations(
    baseEvidence,
    check,
    facts,
    web.results
  );
}

export async function fetchWebRegulationContextForCheck(
  check: Pick<ComplianceCheck, "code" | "section" | "requirement" | "requirementZh" | "category">
): Promise<WebSearchResult[]> {
  if (!isWebSearchConfigured()) return [];
  const web = await searchRegulationsOnline({
    codeRef: check.code,
    section: check.section,
    requirement: check.requirementZh ?? check.requirement,
    category: check.category,
  });
  return web.results;
}

export async function loadStructuredRegulationContextAsync(
  project: ProjectWithRelations
): Promise<{
  facts: RegulationFactWithSource[];
  promptBlock: string;
  chainSnippets: string;
  webRegulationBlock?: string;
}> {
  const facts = collectStructuredRegulationFacts(project.documents);
  let webRegulationBlock: string | undefined;

  if (facts.length === 0 && isWebSearchConfigured()) {
    const web = await searchRegulationsOnline({
      codeRef: "GB 50016 GB 50352",
      requirement: `${project.targetFunction} 改造 防火 无障碍`,
    });
    if (web.results.length > 0) {
      webRegulationBlock = formatWebSearchSnippets(web.results, {
        prefix: "联网规范参考",
        maxItems: 4,
      });
    }
  }

  return {
    facts,
    promptBlock: formatStructuredRegulationsBlock(facts, webRegulationBlock),
    chainSnippets: formatStructuredRegulationsForComplianceChain(facts),
    webRegulationBlock,
  };
}
