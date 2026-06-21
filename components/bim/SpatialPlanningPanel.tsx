"use client";

import type { BimFurniturePlanning, BimLayoutOptimization, BimFlowSimulation } from "@/types/bim";
import { Badge } from "@/components/ui/badge";
import { LayoutGrid, Users, Armchair } from "lucide-react";

interface SpatialPlanningTabsProps {
  layout?: BimLayoutOptimization;
  flow?: BimFlowSimulation;
  furniture?: BimFurniturePlanning;
  activeTab: "layout" | "flow" | "furniture";
}

const DENSITY_COLORS: Record<string, string> = {
  low: "bg-sage/20 text-sage",
  medium: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  high: "bg-orange-500/20 text-orange-700 dark:text-orange-400",
  critical: "bg-red-500/20 text-red-700 dark:text-red-400",
};

export function SpatialPlanningPanel({
  layout,
  flow,
  furniture,
  activeTab,
}: SpatialPlanningTabsProps) {
  if (activeTab === "layout" && layout) {
    return (
      <div className="space-y-3 text-xs">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">功能布局优化</span>
          <Badge variant="outline">匹配度 {layout.overallScore}%</Badge>
        </div>
        <p className="text-muted-foreground">
          目标功能：{layout.targetFunction} · 总面积 {layout.totalArea} m²
        </p>
        <div className="max-h-[240px] overflow-y-auto space-y-1.5">
          {layout.assignments.map((a) => (
            <div key={a.roomId} className="flex items-start justify-between gap-2 rounded border px-2 py-1.5">
              <div className="min-w-0">
                <p className="font-medium truncate">{a.roomLabel}</p>
                <p className="text-muted-foreground">{a.assignedFunctionZh} · {a.area.toFixed(0)} m²</p>
              </div>
              <Badge className={a.fitScore >= 75 ? "bg-sage/20 text-sage" : "bg-muted"}>
                {a.fitScore}
              </Badge>
            </div>
          ))}
        </div>
        {layout.suggestions.length > 0 && (
          <ul className="space-y-1 text-muted-foreground list-disc pl-4">
            {layout.suggestions.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (activeTab === "flow" && flow) {
    return (
      <div className="space-y-3 text-xs">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">人流模拟</span>
          <Badge variant="outline">峰值 {flow.peakOccupancyEstimate} 人</Badge>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Stat label="平均动线" value={`${flow.averagePathLength.toFixed(1)} m`} />
          <Stat label="瓶颈" value={String(flow.bottleneckCount)} />
          <Stat label="热点" value={String(flow.hotspots.length)} />
        </div>
        <div className="max-h-[200px] overflow-y-auto space-y-1.5">
          {flow.nodes.slice(0, 8).map((node) => (
            <div key={node.roomId} className="flex items-center justify-between rounded border px-2 py-1.5">
              <div>
                <p className="font-medium">{node.label}</p>
                <p className="text-muted-foreground">
                  介数 {node.betweenness} · 峰值 ~{node.estimatedPeakFlow} 人
                </p>
              </div>
              <Badge className={DENSITY_COLORS[node.densityLevel]}>
                {node.densityLevel}
              </Badge>
            </div>
          ))}
        </div>
        <ul className="space-y-1 text-muted-foreground list-disc pl-4">
          {flow.recommendations.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>
    );
  }

  if (activeTab === "furniture" && furniture) {
    return (
      <div className="space-y-3 text-xs">
        <div className="flex items-center gap-2">
          <Armchair className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">家具布置建议</span>
          <Badge variant="outline">{furniture.totalItems} 件</Badge>
        </div>
        <p className="text-muted-foreground">
          平均空间利用率 {furniture.averageUtilization}%
        </p>
        <div className="max-h-[240px] overflow-y-auto space-y-2">
          {furniture.plans.slice(0, 6).map((plan) => (
            <div key={plan.roomId} className="rounded border p-2 space-y-1">
              <p className="font-medium">
                {plan.roomLabel} · {plan.functionType}
              </p>
              <p className="text-muted-foreground">{plan.clearanceNote}</p>
              <div className="flex flex-wrap gap-1">
                {plan.items.map((item) => (
                  <Badge key={item.id} variant="outline" className="text-[10px]">
                    {item.nameZh} ({item.width}×{item.depth}m)
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
        <ul className="space-y-1 text-muted-foreground list-disc pl-4">
          {furniture.globalNotes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <p className="text-xs text-muted-foreground py-4 text-center">
      暂无空间规划数据，请确保模型包含房间信息
    </p>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border bg-muted/20 px-2 py-1.5 text-center">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
