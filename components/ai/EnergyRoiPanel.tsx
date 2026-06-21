import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EnergyRoiSummary } from "@/types/ai";
import { Leaf, TrendingUp } from "lucide-react";

interface EnergyRoiPanelProps {
  energyRoi: EnergyRoiSummary;
}

export function EnergyRoiPanel({ energyRoi }: EnergyRoiPanelProps) {
  const ratingColor =
    energyRoi.rating === "good"
      ? "border-green-300 text-green-800"
      : energyRoi.rating === "poor"
        ? "border-destructive text-destructive"
        : "border-amber-300 text-amber-800";

  return (
    <Card className="border-sage/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Leaf className="h-4 w-4 text-sage" />
          Energy ROI · 能效投资回报
          {energyRoi.linkedStrategyName && (
            <Badge variant="outline" className="text-[10px] font-normal ml-auto">
              Linked: {energyRoi.linkedStrategyName}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-xs">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={ratingColor}>
            EUI {energyRoi.currentEui} → target {energyRoi.targetEui}
          </Badge>
          <Badge variant="outline">{energyRoi.rating}</Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Metric label="投资总额" value={`¥${energyRoi.totalInvestment.toLocaleString()}`} />
          <Metric label="年节省" value={`¥${energyRoi.annualCostSavings.toLocaleString()}`} />
          <Metric label="回收期" value={`${energyRoi.simplePaybackYears} 年`} />
          <Metric
            label="10 年 ROI"
            value={`${energyRoi.roiPercent10Year}%`}
            highlight
          />
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Recommended measures · 推荐措施
          </p>
          <ul className="space-y-1 text-muted-foreground">
            {energyRoi.recommendedMeasures.map((m) => (
              <li key={m.nameZh}>
                • {m.nameZh} — 节能 {m.savingsPercent}%
              </li>
            ))}
          </ul>
        </div>

        <p className="text-muted-foreground flex items-start gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 mt-0.5 shrink-0 text-sage" />
          Lifecycle cost score adjusts downward for <strong>energy_retrofit</strong> strategies
          when payback is favorable — see matrix column below.
        </p>
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-md border bg-muted/20 p-2">
      <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
      <p className={`font-semibold tabular-nums ${highlight ? "text-sage" : ""}`}>{value}</p>
    </div>
  );
}
