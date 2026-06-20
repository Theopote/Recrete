"use client";

import { useState } from "react";
import { StrategyCard } from "@/components/strategies/StrategyCard";
import { StrategyComparisonTable } from "@/components/strategies/StrategyComparisonTable";
import { SectionHeader } from "@/components/app/SectionHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import type { ProjectWithRelations, StrategyWithMetrics } from "@/types";
import { Lightbulb, Sparkles, GitCompare } from "lucide-react";

interface StrategiesSectionProps {
  project: ProjectWithRelations;
  strategiesWithMetrics: StrategyWithMetrics[];
}

export function StrategiesSection({ project, strategiesWithMetrics: initialMetrics }: StrategiesSectionProps) {
  const [strategies, setStrategies] = useState(initialMetrics);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showComparison, setShowComparison] = useState(true);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/strategies/generate`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setStrategies((prev) => [...data, ...prev]);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const recommended = strategies.find((s) => s.recommendationReason);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Renovation Strategies"
        description="Compare multiple renovation approaches with cost, schedule, and risk analysis"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowComparison(!showComparison)}
            >
              <GitCompare className="h-3.5 w-3.5 mr-1.5" />
              {showComparison ? "Hide" : "Show"} Comparison
            </Button>
            <Button variant="copper" size="sm" onClick={handleGenerate} disabled={isGenerating}>
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              {isGenerating ? "Generating..." : "Generate Strategies"}
            </Button>
          </div>
        }
      />

      {showComparison && strategies.length > 1 && (
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Strategy Comparison
          </h3>
          <StrategyComparisonTable strategies={strategies} />
        </div>
      )}

      {strategies.length > 0 ? (
        <div className="space-y-4">
          {strategies.map((strategy) => (
            <StrategyCard
              key={strategy.id}
              strategy={strategy}
              isRecommended={strategy.id === recommended?.id}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Lightbulb}
          title="No strategies yet"
          description="Generate AI-powered renovation strategies based on project data and diagnosis findings."
          action={{ label: "Generate Strategies", onClick: handleGenerate }}
        />
      )}
    </div>
  );
}
