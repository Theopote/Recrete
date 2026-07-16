"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { SectionHeader } from "@/components/app/SectionHeader";
import { RiskMatrix } from "@/components/ai/RiskMatrix";
import { EnergyRoiPanel } from "@/components/ai/EnergyRoiPanel";
import { AIInsightList } from "@/components/ai/AIInsightList";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ProjectWithRelations, StrategyWithMetrics } from "@/types";
import type { AIInsight, CostRiskMatrix } from "@/types/ai";
import { COST_RISK_INSIGHT_SOURCE } from "@/types/ai";
import { Sparkles, Loader2 } from "lucide-react";
import { ProjectCostRecordPanel } from "@/components/cost/ProjectCostRecordPanel";
import { useLocale } from "@/lib/i18n/use-locale";

interface CostRiskSectionProps {
  project: ProjectWithRelations;
  strategiesWithMetrics: StrategyWithMetrics[];
}

function filterCostRiskInsights(insights: AIInsight[] | undefined) {
  return (insights ?? []).filter((i) => i.sourceType === COST_RISK_INSIGHT_SOURCE);
}

export function CostRiskSection({ project, strategiesWithMetrics }: CostRiskSectionProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [matrix, setMatrix] = useState<CostRiskMatrix | null>(null);
  const [phasing, setPhasing] = useState<string[]>([]);
  const [costRiskInsights, setCostRiskInsights] = useState<AIInsight[]>(() =>
    filterCostRiskInsights(project.insights)
  );
  const [loading, setLoading] = useState(false);

  const energyOpportunities = useMemo(
    () => costRiskInsights.filter((i) => i.type === "opportunity"),
    [costRiskInsights]
  );

  const persistedCostWarnings = useMemo(
    () => costRiskInsights.filter((i) => i.type === "cost_warning"),
    [costRiskInsights]
  );

  const otherCostInsights = useMemo(
    () =>
      (project.insights ?? []).filter(
        (i) =>
          (i.type === "cost_warning" || i.type === "schedule_warning") &&
          i.sourceType !== COST_RISK_INSIGHT_SOURCE
      ),
    [project.insights]
  );

  const allCostWarnings = [...otherCostInsights, ...persistedCostWarnings];

  const loadMatrix = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/cost-risk`, { method: "POST" });
      const data = await res.json();
      setMatrix(data.matrix);
      setPhasing(data.phasingPlan ?? data.matrix?.phasingPlan ?? []);
      if (Array.isArray(data.insights)) {
        setCostRiskInsights(data.insights);
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCostRiskInsights(filterCostRiskInsights(project.insights));
  }, [project.insights]);

  useEffect(() => {
    if (strategiesWithMetrics.length > 0 && !matrix) {
      loadMatrix();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Cost & Risk"
        titleZh="成本与风险"
        description="AI-estimated cost warnings, energy ROI, schedule risks, and phased implementation planning"
        descriptionZh="AI 成本预警、能效 ROI、进度风险与分阶段实施规划"
        action={
          <Button variant="copper" size="sm" onClick={loadMatrix} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            )}
            {t("Estimate Cost & Risk", "估算成本与风险")}
          </Button>
        }
      />

      <ProjectCostRecordPanel project={project} />

      {matrix?.energyRoi && <EnergyRoiPanel energyRoi={matrix.energyRoi} />}

      {matrix ? (
        <RiskMatrix matrix={matrix} />
      ) : (
        <Card>
          <CardContent className="p-6 text-center text-xs text-muted-foreground">
            {t(
              "Generate cost & risk analysis from renovation strategies",
              "基于改造方案生成成本与风险分析"
            )}
          </CardContent>
        </Card>
      )}

      {energyOpportunities.length > 0 && (
        <div>
          <SectionHeader title="Energy ROI Opportunities" titleZh="能效 ROI 机会" />
          <p className="text-[10px] text-muted-foreground mb-2 -mt-4">
            {t("Persisted to project insights", "已写入项目洞察")}
          </p>
          <AIInsightList insights={energyOpportunities} compact />
        </div>
      )}

      {allCostWarnings.length > 0 && (
        <div>
          <SectionHeader title="Cost & Schedule Warnings" titleZh="成本与进度预警" />
          <AIInsightList insights={allCostWarnings} compact />
        </div>
      )}

      {phasing.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              {t("Suggested Phasing Plan", "建议分期计划")}
            </h4>
            <ol className="space-y-2">
              {phasing.map((phase, i) => (
                <li key={i} className="text-xs text-foreground/85 leading-relaxed">
                  <span className="font-mono text-muted-foreground mr-2">{i + 1}.</span>
                  {phase}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      <div>
        <SectionHeader
          title="Strategy Risk Overview"
          titleZh="方案风险概览"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {strategiesWithMetrics.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-4">
                <p className="text-xs font-semibold mb-2">{s.name}</p>
                <div className="space-y-1 text-[10px] font-mono text-muted-foreground">
                  <p>Cost: {s.costLevel} · Schedule: {s.scheduleLevel}</p>
                  <p>Risk: {s.riskLevel}</p>
                  {s.designValueScore != null && <p>Design value: {s.designValueScore}/100</p>}
                  {s.feasibilityScore != null && <p>Feasibility: {s.feasibilityScore}/100</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
