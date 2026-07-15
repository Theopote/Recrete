"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StrategyCard } from "@/components/strategies/StrategyCard";
import { StrategyComparisonTable } from "@/components/strategies/StrategyComparisonTable";
import { CreateStrategyForm } from "@/components/strategies/CreateStrategyForm";
import { StrategyLabParamsForm } from "@/components/strategies/StrategyLabParamsForm";
import { SectionHeader } from "@/components/app/SectionHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import type { ProjectWithRelations, StrategyWithMetrics } from "@/types";
import type { StrategyLabParams } from "@/types/ai";
import { StrategyRankingPanel } from "@/components/strategies/StrategyRankingPanel";
import { StrategySpatialCompareSection } from "@/components/strategies/StrategySpatialCompareSection";
import { SimilarCasesPanel } from "@/components/ai/SimilarCasesPanel";
import { RoleGate } from "@/components/auth/RoleGate";
import { Lightbulb, Sparkles, GitCompare } from "lucide-react";

interface StrategiesSectionProps {
  project: ProjectWithRelations;
  strategiesWithMetrics: StrategyWithMetrics[];
}

export function StrategiesSection({ project, strategiesWithMetrics: initialMetrics }: StrategiesSectionProps) {
  const router = useRouter();
  const [strategies, setStrategies] = useState(initialMetrics);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showComparison, setShowComparison] = useState(true);
  const [labParams, setLabParams] = useState<Partial<StrategyLabParams>>({});

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/strategies/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ params: labParams }),
      });
      if (res.ok) {
        const data = await res.json();
        setStrategies(data.strategies.map(parseStrategy));
        router.refresh();
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefined = (updated: StrategyWithMetrics) => {
    setStrategies((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    router.refresh();
  };

  const handleCreated = (strategy: StrategyWithMetrics) => {
    setStrategies((prev) => [strategy, ...prev]);
  };

  const recommended = strategies.find((s) => s.recommendationReason);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Strategy Lab"
        titleZh="AI 策略实验室"
        description="Generate three professional renovation strategies — light, medium, and deep — with automatic comparison."
        descriptionZh="一键生成轻介入、中度重组、深度再造三套方案，并自动比较成本、风险、工期与可实施性。"
        action={
          <div className="flex flex-wrap gap-2">
            <RoleGate action="create_strategy">
              <CreateStrategyForm projectId={project.id} onCreated={handleCreated} />
            </RoleGate>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowComparison(!showComparison)}
            >
              <GitCompare className="h-3.5 w-3.5 mr-1.5" />
              {showComparison ? "Hide" : "Show"} Comparison
            </Button>
            <RoleGate action="create_strategy">
              <Button variant="copper" size="sm" onClick={handleGenerate} disabled={isGenerating}>
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                {isGenerating ? "Generating..." : "Generate Strategies"}
              </Button>
            </RoleGate>
          </div>
        }
      />

      <StrategyLabParamsForm
        onChange={setLabParams}
        projectArea={project.grossFloorArea}
        projectBudget={project.budgetLevel}
        targetFunction={project.targetFunction}
      />

      <SimilarCasesPanel projectId={project.id} />

      {strategies.some((s) => s.rank != null) && (
        <StrategyRankingPanel strategies={strategies} />
      )}

      {showComparison && strategies.length > 1 && (
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Strategy Comparison
          </h3>
          <StrategyComparisonTable strategies={strategies} />
        </div>
      )}

      {strategies.length > 0 && (
        <StrategySpatialCompareSection projectId={project.id} strategies={strategies} />
      )}

      {strategies.length > 0 ? (
        <div className="space-y-4">
          {[...strategies]
            .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
            .map((strategy) => (
            <StrategyCard
              key={strategy.id}
              strategy={strategy}
              isRecommended={strategy.id === recommended?.id}
              projectId={project.id}
              onRefined={handleRefined}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Lightbulb}
          title="No strategies yet"
          description="Click Generate Strategies to compare three AI options: light intervention, medium reconfiguration, and deep recreation."
          action={{ label: "Generate Strategies", onClick: handleGenerate }}
        />
      )}
    </div>
  );
}

function parseStrategy(s: StrategyWithMetrics): StrategyWithMetrics {
  return {
    ...s,
    createdAt: new Date(s.createdAt),
    updatedAt: new Date(s.updatedAt),
  };
}
