import "server-only";

import {
  getProjectById,
  replaceStrategies,
  updateStrategy,
  addInsights,
  addAnalysisRun,
  updateBuildingMemory,
  addStrategyVersion,
  getStrategyVersions,
  getProjectEvidence,
} from "@/lib/db/repository";
import { linkStrategiesToSources } from "@/lib/ai/strategy-evidence-linker";
import { getAIPlatform } from "@/lib/ai";
import { computeStrategyMetrics } from "@/lib/utils/strategy-metrics";
import {
  attachStrategyRankings,
  buildRecommendationReason,
  rankStrategies,
  resolveStrategyLabParams,
} from "@/lib/utils/strategy-ranking";
import { diffStrategySnapshots, summarizeStrategyDiff } from "@/lib/utils/strategy-diff";
import type { RenovationStrategy, StrategyWithMetrics } from "@/types";
import type { AIInsight, BuildingMemory, AIAnalysisRun, StrategyLabParams } from "@/types/ai";

export interface StrategyWorkflowOptions {
  params?: Partial<StrategyLabParams>;
  refreshBuildingMemory?: boolean;
}

export interface StrategyWorkflowResult {
  strategies: StrategyWithMetrics[];
  recommendation: {
    strategyId: string;
    reason: string;
    insight: AIInsight;
  } | null;
  analysisRun: AIAnalysisRun;
  buildingMemory?: BuildingMemory | null;
}

export interface StrategyIterationOptions {
  strategyId: string;
  instruction: string;
  refreshBuildingMemory?: boolean;
}

export interface StrategyIterationResult {
  strategy: StrategyWithMetrics;
  insight: AIInsight;
  analysisRun: AIAnalysisRun;
  buildingMemory?: BuildingMemory | null;
  version?: import("@/types/ai").StrategyVersion;
  diffs?: import("@/lib/utils/strategy-diff").StrategyFieldDiff[];
}

function resolveParams(
  project: NonNullable<Awaited<ReturnType<typeof getProjectById>>>,
  params?: Partial<StrategyLabParams>
): StrategyLabParams {
  return resolveStrategyLabParams(project, params);
}

export async function runStrategyWorkflow(
  projectId: string,
  organizationId: string,
  options: StrategyWorkflowOptions = {}
): Promise<StrategyWorkflowResult | null> {
  const { params, refreshBuildingMemory = true } = options;

  const project = await getProjectById(projectId, organizationId);
  if (!project) return null;

  const platform = getAIPlatform();
  const resolvedParams = resolveParams(project, params);

  const strategies = await platform.strategy.generateRenovationStrategies(
    project,
    project.diagnosis ?? [],
    resolvedParams
  );
  const created = await replaceStrategies(projectId, strategies);

  const evidence =
    (project.sourceEvidence?.length ?? 0) > 0
      ? project.sourceEvidence!
      : await getProjectEvidence(projectId);
  const sourceLinks = linkStrategiesToSources(created, project.diagnosis ?? [], evidence);

  const linkedCreated: RenovationStrategy[] = [];
  for (const strategy of created) {
    const link = sourceLinks.get(strategy.id);
    if (!link) {
      linkedCreated.push(strategy);
      continue;
    }
    const updated = await updateStrategy(strategy.id, {
      linkedDiagnosisIds: link.diagnosisIds,
      linkedEvidenceIds: link.evidenceIds,
    });
    linkedCreated.push(
      updated ?? {
        ...strategy,
        linkedDiagnosisIds: link.diagnosisIds,
        linkedEvidenceIds: link.evidenceIds,
      }
    );
  }

  for (const strategy of linkedCreated) {
    await addStrategyVersion(projectId, strategy, {
      label: "Initial generation",
      changeSummary: "Strategy Lab batch generation",
    });
  }

  const withMetrics = linkedCreated.map((s) => ({
    ...s,
    metrics: computeStrategyMetrics(s, project, created),
  }));

  const rankings = rankStrategies(withMetrics, project, resolvedParams);
  const rankedStrategies = attachStrategyRankings(withMetrics, project, resolvedParams);
  const topRank = rankings[0];
  const topRanked = rankedStrategies.find((strategy) => strategy.id === topRank?.strategyId);
  let recommendationResult = null;

  if (topRank && topRanked) {
    const reason = buildRecommendationReason(topRank, topRanked.name, resolvedParams);

    await updateStrategy(topRanked.id, {
      recommendationReason: reason,
    });

    const [insight] = await addInsights(projectId, [
      {
        title: `Recommended: ${topRanked.name}`,
        type: "design_strategy",
        priority: "medium",
        summary: topRank.summary,
        evidence: `Multi-criteria score ${topRank.compositeScore}/100 across ${linkedCreated.length} strategies`,
        recommendation: reason,
        confidence: 0.88,
        status: "open",
        sourceType: "strategy",
        sourceId: topRanked.id,
      },
    ]);

    recommendationResult = {
      strategyId: topRanked.id,
      reason,
      insight,
    };
  }

  const analysisRun = await addAnalysisRun({
    projectId,
    analysisType: "strategy_generation",
    inputSummary: `Strategy Lab — ambition: ${resolvedParams.designAmbition}, preservation: ${resolvedParams.preservationLevel}`,
    outputSummary: `Generated ${linkedCreated.length} strategies${recommendationResult ? `, recommended ${recommendationResult.strategyId}` : ""}`,
    generatedItemCount: linkedCreated.length + (recommendationResult ? 1 : 0),
    modelName: "recrete-strategy-v1",
    confidence: 0.88,
  });

  let buildingMemory: BuildingMemory | null | undefined;
  if (refreshBuildingMemory) {
    buildingMemory = await updateBuildingMemory(projectId, organizationId, "strategy_generation");
  }

  return {
    strategies: rankedStrategies,
    recommendation: recommendationResult,
    analysisRun,
    buildingMemory,
  };
}

export async function runStrategyIterationWorkflow(
  projectId: string,
  organizationId: string,
  options: StrategyIterationOptions
): Promise<StrategyIterationResult | null> {
  const { strategyId, instruction, refreshBuildingMemory = true } = options;

  const project = await getProjectById(projectId, organizationId);
  if (!project) return null;

  const existing = (project.strategies ?? []).find((s) => s.id === strategyId);
  if (!existing) return null;

  const platform = getAIPlatform();
  const previousVersions = await getStrategyVersions(strategyId);
  const previousSnapshot = previousVersions[0]?.snapshot ?? existing;

  const refined = await platform.strategy.refineStrategy(project, existing, instruction);
  const updated = await updateStrategy(strategyId, refined);
  if (!updated) return null;

  const diffs = diffStrategySnapshots(previousSnapshot, updated);
  const version = await addStrategyVersion(projectId, updated, {
    label: `Iteration v${previousVersions.length + 1}`,
    instruction,
    changeSummary: summarizeStrategyDiff(diffs),
  });

  const strategy: StrategyWithMetrics = {
    ...updated,
    metrics: computeStrategyMetrics(updated, project, project.strategies ?? []),
  };

  const [insight] = await addInsights(projectId, [
    {
      title: `Strategy refined: ${updated.name}`,
      type: "design_strategy",
      priority: "medium",
      summary: instruction.slice(0, 200),
      evidence: `Iteration on strategy ${strategyId}`,
      recommendation: updated.summary.slice(0, 300),
      confidence: 0.83,
      status: "open",
      sourceType: "strategy",
      sourceId: strategyId,
    },
  ]);

  const analysisRun = await addAnalysisRun({
    projectId,
    analysisType: "strategy_generation",
    inputSummary: `Strategy iteration — ${existing.name}`,
    outputSummary: instruction.slice(0, 500),
    generatedItemCount: 1,
    modelName: "recrete-strategy-v1",
    confidence: 0.85,
  });

  let buildingMemory: BuildingMemory | null | undefined;
  if (refreshBuildingMemory) {
    buildingMemory = await updateBuildingMemory(projectId, organizationId, "strategy_generation");
  }

  return { strategy, insight, analysisRun, buildingMemory, version, diffs };
}

export function findStrategyForInstruction(
  strategies: RenovationStrategy[],
  instruction: string
): RenovationStrategy | undefined {
  const lower = instruction.toLowerCase();
  const indexMatch = lower.match(/(?:option|strategy|方案)\s*([123])|第\s*([123])\s*(?:套|个)?/);
  if (indexMatch) {
    const idx = Number(indexMatch[1] ?? indexMatch[2]) - 1;
    if (idx >= 0 && idx < strategies.length) return strategies[idx];
  }

  if (lower.includes("adaptive") || lower.includes("中度") || lower.includes("medium")) {
    return strategies.find((s) => s.type === "adaptive_reuse");
  }
  if (lower.includes("light") || lower.includes("轻介入")) {
    return strategies.find((s) => s.type === "light_renewal");
  }
  if (lower.includes("deep") || lower.includes("深度")) {
    return strategies.find((s) => s.type === "deep_recreation");
  }

  return strategies.find((s) => s.recommendationReason) ?? strategies[0];
}
