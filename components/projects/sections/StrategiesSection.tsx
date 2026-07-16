"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { AIDisclaimer } from "@/components/ai/AIDisclaimer";
import { AIErrorBanner } from "@/components/ai/AIErrorBanner";
import { parseAIErrorResponse } from "@/lib/ai/client-messages";
import { RoleGate } from "@/components/auth/RoleGate";
import { Lightbulb, Sparkles, GitCompare } from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";

interface StrategiesSectionProps {
  project: ProjectWithRelations;
  strategiesWithMetrics: StrategyWithMetrics[];
}

export function StrategiesSection({ project, strategiesWithMetrics: initialMetrics }: StrategiesSectionProps) {
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const showWelcome = searchParams.get("welcome") === "1";
  const [strategies, setStrategies] = useState(initialMetrics);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<{ message: string; retryable: boolean } | null>(null);
  const [recommendation, setRecommendation] = useState<{
    strategyId: string;
    reason: string;
  } | null>(null);
  const [showComparison, setShowComparison] = useState(true);
  const [labParams, setLabParams] = useState<Partial<StrategyLabParams>>({});

  const handleGenerate = async () => {
    setIsGenerating(true);
    setAiError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/strategies/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ params: labParams }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStrategies(data.strategies.map(parseStrategy));
        setRecommendation(data.recommendation ?? null);
        router.refresh();
      } else {
        setAiError(parseAIErrorResponse(data));
      }
    } catch {
      setAiError({
        message: t("Network error. Please try again.", "网络异常，请稍后重试。"),
        retryable: true,
      });
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

  const recommended =
    strategies.find((s) => s.id === recommendation?.strategyId) ??
    strategies.find((s) => s.recommendationReason);

  const riskOptions = [
    ...(project.buildingMemory?.keyRisks ?? []),
    ...strategies.flatMap((s) => s.cons.slice(0, 2)),
  ].slice(0, 8);

  const documentNames = Object.fromEntries(
    (project.documents ?? []).map((d) => [d.id, d.name])
  );

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
              {showComparison ? t("Hide", "隐藏") : t("Show", "显示")}{" "}
              {t("Comparison", "对比")}
            </Button>
            <RoleGate action="create_strategy">
              <Button variant="copper" size="sm" onClick={handleGenerate} disabled={isGenerating}>
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                {isGenerating
                  ? t("Generating...", "生成中...")
                  : t("Generate Strategies", "生成方案")}
              </Button>
            </RoleGate>
          </div>
        }
      />

      <AIDisclaimer />

      {aiError && (
        <AIErrorBanner
          message={aiError.message}
          retryable={aiError.retryable}
          onRetry={handleGenerate}
          onDismiss={() => setAiError(null)}
        />
      )}

      {recommendation && (
        <div className="rounded-lg border border-copper/30 bg-copper/5 px-4 py-3 text-xs">
          <p className="font-medium text-copper">{t("AI Recommended Strategy", "AI 推荐方案")}</p>
          <p className="mt-1 text-muted-foreground leading-relaxed">{recommendation.reason}</p>
        </div>
      )}

      <StrategyLabParamsForm
        onChange={setLabParams}
        projectArea={project.grossFloorArea}
        projectBudget={project.budgetLevel}
        targetFunction={project.targetFunction}
      />

      {strategies.length === 0 && showWelcome && (
        <div className="rounded-lg border border-copper/30 bg-copper/5 px-4 py-3 text-xs">
          <p className="font-medium">{t("Project created!", "项目已创建！")}</p>
          <p className="mt-1 text-muted-foreground">
            {t(
              'Next: click "Generate Strategies" to compare three renovation options.',
              "下一步：点击「生成方案」对比三套改造策略。"
            )}
          </p>
        </div>
      )}

      <SimilarCasesPanel projectId={project.id} />

      {strategies.some((s) => s.rank != null) && (
        <StrategyRankingPanel strategies={strategies} />
      )}

      {showComparison && strategies.length > 1 && (
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            {t("Strategy Comparison", "方案对比")}
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
              riskOptions={riskOptions}
              diagnosis={project.diagnosis ?? []}
              evidence={project.sourceEvidence ?? []}
              documentNames={documentNames}
              onRefined={handleRefined}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Lightbulb}
          title={t("No strategies yet", "暂无改造方案")}
          description={t(
            "Click Generate Strategies to compare three AI options: light intervention, medium reconfiguration, and deep recreation.",
            "点击「生成方案」对比轻介入、中度重组、深度再造三套 AI 方案。"
          )}
          action={{
            label: t("Generate Strategies", "生成方案"),
            onClick: handleGenerate,
          }}
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
