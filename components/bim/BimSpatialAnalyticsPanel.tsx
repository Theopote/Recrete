"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { SpatialPlanViewer } from "@/components/bim/SpatialPlanViewer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { RenovationStrategy } from "@/types";
import type { BimModel, BimSpatialAnalytics } from "@/types/bim";
import { Loader2, Route, Flame, GitCompare, LayoutGrid, Users, Armchair, Tag } from "lucide-react";
import { SpatialPlanningPanel } from "@/components/bim/SpatialPlanningPanel";
import { SpatialAnnotationPanel } from "@/components/bim/SpatialAnnotationPanel";
import type { BimSpatialAnnotation } from "@/types/bim";
import { useLocale } from "@/lib/i18n/use-locale";

const GltfModelViewer = dynamic(
  () => import("@/components/bim/GltfModelViewer").then((m) => m.GltfModelViewer),
  { ssr: false, loading: () => <div className="min-h-[280px] animate-pulse rounded-md border bg-muted/20" /> }
);

const IfcModelViewer = dynamic(
  () => import("@/components/bim/IfcModelViewer").then((m) => m.IfcModelViewer),
  { ssr: false, loading: () => <div className="min-h-[280px] animate-pulse rounded-md border bg-muted/20" /> }
);

type AnalyticsTab = "circulation" | "cost" | "compare" | "layout" | "flow" | "furniture" | "annotations";

interface BimSpatialAnalyticsPanelProps {
  projectId: string;
  model: BimModel;
  strategies?: RenovationStrategy[];
}

export function BimSpatialAnalyticsPanel({
  projectId,
  model,
  strategies = [],
}: BimSpatialAnalyticsPanelProps) {
  const { t } = useLocale();
  const [tab, setTab] = useState<AnalyticsTab>("circulation");
  const [strategyId, setStrategyId] = useState<string>("");
  const [fromRoomId, setFromRoomId] = useState<string>("");
  const [toRoomId, setToRoomId] = useState<string>("");
  const [activePathId, setActivePathId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<BimSpatialAnnotation[]>([]);
  const [analytics, setAnalytics] = useState<BimSpatialAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  const rooms = model.metadata?.rooms ?? [];

  useEffect(() => {
    if (rooms.length === 0) return;
    if (!fromRoomId) setFromRoomId(rooms[0].id);
    if (!toRoomId && rooms[1]) setToRoomId(rooms[1].id);
  }, [rooms, fromRoomId, toRoomId]);

  useEffect(() => {
    if (rooms.length === 0) return;

    let cancelled = false;
    setLoading(true);

    const params = new URLSearchParams();
    if (strategyId) params.set("strategyId", strategyId);
    if (fromRoomId) params.set("fromRoomId", fromRoomId);
    if (toRoomId) params.set("toRoomId", toRoomId);
    if (tab === "layout" || tab === "flow" || tab === "furniture") {
      params.set("withAi", "true");
    }

    fetch(`/api/projects/${projectId}/bim-models/${model.id}/spatial-analytics?${params}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setAnalytics(data as BimSpatialAnalytics);
        const customPath = (data as BimSpatialAnalytics).circulation.paths[0];
        setActivePathId(customPath?.id ?? (data as BimSpatialAnalytics).circulation.mainSpine?.id ?? null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectId, model.id, strategyId, fromRoomId, toRoomId, rooms.length, tab]);

  useEffect(() => {
    if (tab !== "annotations" && tab !== "layout") return;
    fetch(`/api/projects/${projectId}/bim-models/${model.id}/annotations`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setAnnotations(
          (data.annotations as BimSpatialAnnotation[]).map((a) => ({
            ...a,
            createdAt: new Date(a.createdAt),
            updatedAt: new Date(a.updatedAt),
          }))
        );
      })
      .catch(() => undefined);
  }, [projectId, model.id, tab]);

  const layoutAssignmentScores = useMemo(() => {
    const map: Record<string, number> = {};
    for (const assignment of analytics?.layout?.assignments ?? []) {
      map[assignment.roomId] = assignment.fitScore;
    }
    return map;
  }, [analytics?.layout?.assignments]);

  const selectedLayoutAssignment = analytics?.layout?.assignments.find(
    (a) => a.roomId === selectedRoomId
  );

  const selectedStrategy = strategies.find((strategy) => strategy.id === strategyId) ?? null;
  const planMode =
    tab === "circulation" ? "circulation" : tab === "cost" ? "cost" : "impact";

  const modelUrl = model.gltfUrl ?? model.fileUrl;
  const useGltf = Boolean(model.gltfUrl);

  const topCostRooms = useMemo(
    () => (analytics?.roomCosts ?? []).slice(0, 5),
    [analytics?.roomCosts]
  );

  if (rooms.length === 0) return null;

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mr-2">
            {t("Spatial Analytics", "空间分析")}
          </p>
          <Button
            size="sm"
            variant={tab === "circulation" ? "default" : "outline"}
            onClick={() => setTab("circulation")}
          >
            <Route className="mr-1.5 h-3.5 w-3.5" />
            {t("Circulation", "动线")}
          </Button>
          <Button
            size="sm"
            variant={tab === "cost" ? "default" : "outline"}
            onClick={() => setTab("cost")}
          >
            <Flame className="mr-1.5 h-3.5 w-3.5" />
            {t("Cost Heatmap", "成本热力图")}
          </Button>
          <Button
            size="sm"
            variant={tab === "compare" ? "default" : "outline"}
            onClick={() => setTab("compare")}
          >
            <GitCompare className="mr-1.5 h-3.5 w-3.5" />
            {t("Strategy 3D Compare", "方案三维对比")}
          </Button>
          <Button
            size="sm"
            variant={tab === "layout" ? "default" : "outline"}
            onClick={() => setTab("layout")}
          >
            <LayoutGrid className="mr-1.5 h-3.5 w-3.5" />
            {t("Layout", "布局")}
          </Button>
          <Button
            size="sm"
            variant={tab === "flow" ? "default" : "outline"}
            onClick={() => setTab("flow")}
          >
            <Users className="mr-1.5 h-3.5 w-3.5" />
            {t("Flow", "人流")}
          </Button>
          <Button
            size="sm"
            variant={tab === "furniture" ? "default" : "outline"}
            onClick={() => setTab("furniture")}
          >
            <Armchair className="mr-1.5 h-3.5 w-3.5" />
            {t("Furniture", "家具")}
          </Button>
          <Button
            size="sm"
            variant={tab === "annotations" ? "default" : "outline"}
            onClick={() => setTab("annotations")}
          >
            <Tag className="mr-1.5 h-3.5 w-3.5" />
            {t("Annotations", "标注")}
          </Button>
        </div>

        {strategies.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground">{t("Strategy:", "方案：")}</span>
            <select
              className="rounded-md border bg-background px-2 py-1"
              value={strategyId}
              onChange={(event) => setStrategyId(event.target.value)}
            >
              <option value="">{t("Baseline (no strategy)", "基线（无方案）")}</option>
              {strategies.map((strategy) => (
                <option key={strategy.id} value={strategy.id}>
                  {strategy.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {tab === "circulation" && (
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <SpatialPlanViewer
              previewUrl={model.previewUrl}
              rooms={rooms}
              bounds={model.metadata?.bounds}
              analytics={analytics}
              mode="circulation"
              activePathId={activePathId}
              label={t("Circulation paths", "动线路径")}
              className="min-h-[360px]"
            />
            <div className="space-y-3 text-xs">
              <div className="space-y-2">
                <label className="block text-muted-foreground">{t("From", "起点")}</label>
                <select
                  className="w-full rounded-md border bg-background px-2 py-1.5"
                  value={fromRoomId}
                  onChange={(event) => setFromRoomId(event.target.value)}
                >
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-muted-foreground">{t("To", "终点")}</label>
                <select
                  className="w-full rounded-md border bg-background px-2 py-1.5"
                  value={toRoomId}
                  onChange={(event) => setToRoomId(event.target.value)}
                >
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.label}
                    </option>
                  ))}
                </select>
              </div>
              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("Analyzing paths…", "分析路径中…")}
                </div>
              ) : (
                <>
                  {analytics?.circulation.paths[0] && (
                    <div className="rounded-md border bg-muted/20 p-3 space-y-1">
                      <p className="font-medium text-foreground">{t("Selected path", "选定路径")}</p>
                      <p>
                        {analytics.circulation.paths[0].fromLabel} →{" "}
                        {analytics.circulation.paths[0].toLabel}
                      </p>
                      <p>
                        {t("Length:", "长度：")} {analytics.circulation.paths[0].length.toFixed(2)} m
                      </p>
                      <p>
                        {t(
                          `Via ${analytics.circulation.paths[0].roomIds.length} spaces`,
                          `途经 ${analytics.circulation.paths[0].roomIds.length} 个空间`
                        )}
                      </p>
                    </div>
                  )}
                  {analytics?.circulation.mainSpine && (
                    <button
                      type="button"
                      className="w-full rounded-md border px-2 py-2 text-left hover:bg-muted/40"
                      onClick={() => setActivePathId(analytics.circulation.mainSpine!.id)}
                    >
                      <p className="font-medium text-foreground">{t("Main spine", "主轴线")}</p>
                      <p className="text-muted-foreground">
                        {analytics.circulation.mainSpine.length.toFixed(2)} m ·{" "}
                        {analytics.circulation.mainSpine.fromLabel} →{" "}
                        {analytics.circulation.mainSpine.toLabel}
                      </p>
                    </button>
                  )}
                  <p className="text-muted-foreground">
                    {t("Adjacent links:", "相邻连接：")} {analytics?.circulation.adjacencyCount ?? 0}
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {tab === "cost" && (
          <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
            <SpatialPlanViewer
              previewUrl={model.previewUrl}
              rooms={rooms}
              bounds={model.metadata?.bounds}
              analytics={analytics}
              mode="cost"
              label={t("Spatial cost heatmap", "空间成本热力图")}
              className="min-h-[360px]"
            />
            <div className="space-y-3 text-xs">
              <div className="rounded-md border bg-muted/20 p-3">
                <p className="font-medium text-foreground">{t("Estimate", "估算")}</p>
                <p>¥{analytics?.estimatedCostPerSqm.toLocaleString() ?? "—"} / m²</p>
                <p>
                  {t("Total", "合计")} ¥{analytics?.estimatedTotalCost.toLocaleString() ?? "—"}
                </p>
                {selectedStrategy && (
                  <p className="mt-1 text-muted-foreground">
                    {t("Strategy:", "方案：")} {selectedStrategy.name}
                  </p>
                )}
              </div>
              <div>
                <p className="mb-2 font-medium text-foreground">{t("Top cost zones", "成本最高区域")}</p>
                <div className="space-y-2">
                  {topCostRooms.map((room) => (
                    <div key={room.roomId} className="flex items-center justify-between rounded border px-2 py-1.5">
                      <span className="truncate">{room.label}</span>
                      <span>¥{room.totalCost.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="inline-block h-3 w-8 rounded" style={{ background: "hsla(220,82%,52%,0.55)" }} />
                {t("Low", "低")}
                <span className="inline-block h-3 w-8 rounded" style={{ background: "hsla(0,82%,52%,0.55)" }} />
                {t("High", "高")}
              </div>
            </div>
          </div>
        )}

        {(tab === "layout" || tab === "flow" || tab === "furniture") && (
          <div className="grid gap-3 md:grid-cols-[1fr_280px]">
            <SpatialPlanViewer
              previewUrl={model.previewUrl}
              rooms={rooms}
              bounds={model.metadata?.bounds}
              analytics={analytics}
              mode={tab === "flow" ? "circulation" : tab === "layout" ? "impact" : "cost"}
              activePathId={activePathId}
              label={
                tab === "layout"
                  ? t("Layout · click room for details", "功能布局 · 点击房间查看详情")
                  : tab === "flow"
                    ? t("People flow", "人流动线")
                    : t("Furniture layout", "家具布置")
              }
              className="min-h-[360px]"
              selectedRoomId={selectedRoomId}
              onRoomClick={setSelectedRoomId}
              annotations={annotations}
              layoutAssignments={tab === "layout" ? layoutAssignmentScores : undefined}
            />
            <div className="rounded-md border p-3">
              {loading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("Analyzing…", "分析中…")}
                </div>
              ) : tab === "layout" && selectedLayoutAssignment ? (
                <div className="space-y-2 text-xs">
                  <p className="font-medium">{selectedLayoutAssignment.roomLabel}</p>
                  <p className="text-muted-foreground">
                    {t("Assigned function:", "分配功能：")}
                    {selectedLayoutAssignment.assignedFunctionZh}
                  </p>
                  <p>
                    {t(
                      `Area ${selectedLayoutAssignment.area.toFixed(0)} m² · Fit score ${selectedLayoutAssignment.fitScore}`,
                      `面积 ${selectedLayoutAssignment.area.toFixed(0)} m² · 匹配度 ${selectedLayoutAssignment.fitScore}`
                    )}
                  </p>
                  <p className="text-muted-foreground">{selectedLayoutAssignment.rationale}</p>
                </div>
              ) : (
                <SpatialPlanningPanel
                  layout={analytics?.layout}
                  flow={analytics?.flow}
                  furniture={analytics?.furniture}
                  planningAdvice={analytics?.planningAdvice}
                  activeTab={tab}
                />
              )}
            </div>
          </div>
        )}

        {tab === "annotations" && (
          <div className="grid gap-3 md:grid-cols-[1fr_300px]">
            <SpatialPlanViewer
              previewUrl={model.previewUrl}
              rooms={rooms}
              bounds={model.metadata?.bounds}
              analytics={analytics}
              mode="none"
              label={t("Spatial annotations · click room to add note", "空间标注 · 点击房间添加批注")}
              className="min-h-[360px]"
              selectedRoomId={selectedRoomId}
              onRoomClick={setSelectedRoomId}
              annotations={annotations}
            />
            <div className="rounded-md border p-3">
              <SpatialAnnotationPanel
                projectId={projectId}
                modelId={model.id}
                rooms={rooms}
                selectedRoomId={selectedRoomId}
                onRoomSelect={setSelectedRoomId}
              />
            </div>
          </div>
        )}

        {tab === "compare" && (
          <div className="space-y-4">
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">{t("Before", "现状")}</p>
                {useGltf ? (
                  <GltfModelViewer modelUrl={modelUrl} className="min-h-[280px]" />
                ) : (
                  <IfcModelViewer modelUrl={modelUrl} className="min-h-[280px]" />
                )}
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  {t("After", "改造后")} · {selectedStrategy?.name ?? t("Select a strategy", "选择方案")}
                </p>
                <div className="relative min-h-[280px] overflow-hidden rounded-md border">
                  {useGltf ? (
                    <GltfModelViewer modelUrl={modelUrl} className="min-h-[280px]" />
                  ) : (
                    <IfcModelViewer modelUrl={modelUrl} className="min-h-[280px]" />
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-orange-500/10 mix-blend-multiply" />
                  <div className="absolute bottom-3 left-3 rounded bg-background/90 px-2 py-1 text-[10px] shadow">
                    {t("Strategy impact overlay", "方案影响叠加")}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <SpatialPlanViewer
                previewUrl={model.previewUrl}
                rooms={rooms}
                bounds={model.metadata?.bounds}
                analytics={analytics}
                mode="none"
                label={t("Before plan", "改造前平面图")}
                className="min-h-[280px]"
              />
              <SpatialPlanViewer
                previewUrl={model.previewUrl}
                rooms={rooms}
                bounds={model.metadata?.bounds}
                analytics={analytics}
                mode="impact"
                label={t("After plan (strategy impact)", "改造后平面图（方案影响）")}
                className="min-h-[280px]"
              />
            </div>

            {selectedStrategy && (
              <div className="rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">{selectedStrategy.name}</p>
                <p className="mt-1">{selectedStrategy.spatialStrategy}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
