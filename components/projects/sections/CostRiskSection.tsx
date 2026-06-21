"use client";

import { useState, useEffect } from "react";
import { SectionHeader } from "@/components/app/SectionHeader";
import { RiskMatrix } from "@/components/ai/RiskMatrix";
import { EnergyRoiPanel } from "@/components/ai/EnergyRoiPanel";
import { AIInsightList } from "@/components/ai/AIInsightList";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ProjectWithRelations, StrategyWithMetrics } from "@/types";
import type { AIInsight, CostRiskMatrix } from "@/types/ai";
import { Sparkles, Loader2 } from "lucide-react";

interface CostRiskSectionProps {
  project: ProjectWithRelations;
  strategiesWithMetrics: StrategyWithMetrics[];
}

export function CostRiskSection({ project, strategiesWithMetrics }: CostRiskSectionProps) {
  const [matrix, setMatrix] = useState<CostRiskMatrix | null>(null);
  const [phasing, setPhasing] = useState<string[]>([]);
  const [energyOpportunities, setEnergyOpportunities] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(false);

  const costInsights = (project.insights ?? []).filter(
    (i) => i.type === "cost_warning" || i.type === "schedule_warning"
  );

  const matrixCostWarnings = matrix?.costWarnings ?? [];
  const allCostWarnings = [...costInsights, ...matrixCostWarnings];

  const loadMatrix = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/cost-risk`, { method: "POST" });
      const data = await res.json();
      setMatrix(data.matrix);
      setPhasing(data.phasingPlan ?? data.matrix?.phasingPlan ?? []);
      setEnergyOpportunities(data.matrix?.energyOpportunities ?? []);
    } finally {
      setLoading(false);
    }
  };

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
            Estimate Cost & Risk
          </Button>
        }
      />

      {matrix?.energyRoi && <EnergyRoiPanel energyRoi={matrix.energyRoi} />}

      {matrix ? (
        <RiskMatrix matrix={matrix} />
      ) : (
        <Card>
          <CardContent className="p-6 text-center text-xs text-muted-foreground">
            Generate cost & risk analysis from renovation strategies
          </CardContent>
        </Card>
      )}

      {energyOpportunities.length > 0 && (
        <div>
          <SectionHeader title="Energy ROI Opportunities" titleZh="能效 ROI 机会" />
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
              Suggested Phasing Plan
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
        <SectionHeader title="Strategy Risk Overview" />
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
