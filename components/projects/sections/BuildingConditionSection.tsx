"use client";

import { useEffect, useMemo, useState } from "react";
import { SectionHeader } from "@/components/app/SectionHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfidenceBadge } from "@/components/ai/ConfidenceBadge";
import { DrawingAnalysisOverlayViewer } from "@/components/building-condition/DrawingAnalysisOverlayViewer";
import {
  DRAWING_DISCIPLINE_TABS,
  DRAWING_TYPE_LABELS,
  type DrawingDisciplineFilter,
  type OverlayLayer,
} from "@/lib/building-condition/drawing-viewer-utils";
import { useLocale } from "@/lib/i18n/use-locale";
import type { DrawingAssetWithDocument } from "@/types/drawing";
import type { ProjectWithRelations } from "@/types";
import {
  Building2,
  Layers,
  Upload,
  CheckCircle2,
  CircleDashed,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BuildingConditionSectionProps {
  project: ProjectWithRelations;
}

const LAYER_TOGGLES: { id: OverlayLayer; labelEn: string; labelZh: string; color: string }[] = [
  { id: "rooms", labelEn: "Rooms", labelZh: "空间", color: "bg-emerald-500" },
  { id: "structure", labelEn: "Structure", labelZh: "结构", color: "bg-blue-500" },
  { id: "annotations", labelEn: "Notes", labelZh: "标注", color: "bg-amber-500" },
  { id: "dimensions", labelEn: "Dimensions", labelZh: "尺寸", color: "bg-purple-500" },
];

export function BuildingConditionSection({ project }: BuildingConditionSectionProps) {
  const { locale, t } = useLocale();
  const [assets, setAssets] = useState<DrawingAssetWithDocument[]>([]);
  const [disciplineCounts, setDisciplineCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<DrawingDisciplineFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeLayers, setActiveLayers] = useState<OverlayLayer[]>([
    "rooms",
    "structure",
    "annotations",
  ]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/projects/${project.id}/drawing-assets`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setAssets(data.assets ?? []);
        setDisciplineCounts(data.disciplineCounts ?? {});
        setSelectedId(data.assets?.[0]?.id ?? null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [project.id]);

  const filtered = useMemo(
    () =>
      filter === "all" ? assets : assets.filter((a) => a.drawingType === filter),
    [assets, filter]
  );

  const selected =
    filtered.find((a) => a.id === selectedId) ?? filtered[0] ?? assets[0] ?? null;

  const label = (en: string, zh: string) => (locale === "zh" ? zh : en);

  const disciplineStatus = (key: string) => (disciplineCounts[key] ?? 0) > 0;

  const toggleLayer = (layer: OverlayLayer) => {
    setActiveLayers((prev) =>
      prev.includes(layer) ? prev.filter((l) => l !== layer) : [...prev, layer]
    );
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Building Condition"
        titleZh="建筑现状"
        description="Digitized as-built views from uploaded drawings — plans, elevations, structure, and MEP"
        descriptionZh="基于上传图纸的数字化建筑现状 — 平面、立面、结构与设备"
        action={
          <Button variant="outline" size="sm" asChild>
            <a href={`/projects/${project.id}?section=survey-intelligence`}>
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              {t("Upload & Analyze", "上传并分析")}
            </a>
          </Button>
        }
      />

      <Card className="border-copper/20 bg-copper/5">
        <CardContent className="p-4">
          <p className="text-xs font-medium mb-3 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-copper" />
            {t("Discipline Coverage", "专业资料覆盖")}
          </p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["floor_plan", label("Floor Plans", "平面")],
                ["elevation", label("Elevations", "立面")],
                ["structural", label("Structure", "结构")],
                ["mep", label("MEP", "设备")],
              ] as const
            ).map(([key, name]) => {
              const ok = disciplineStatus(key);
              return (
                <span
                  key={key}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-medium",
                    ok
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {ok ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <CircleDashed className="h-3 w-3" />
                  )}
                  {name}
                  {(disciplineCounts[key] ?? 0) > 0 && (
                    <span className="opacity-70">({disciplineCounts[key]})</span>
                  )}
                </span>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-pulse">
          <div className="h-64 rounded-lg bg-muted/40" />
          <div className="lg:col-span-2 h-96 rounded-lg bg-muted/30" />
        </div>
      ) : assets.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={t("No digitized drawings yet", "尚无数字化图纸")}
          description={t(
            "Upload floor plans, elevations, or MEP drawings in Survey Intelligence. AI will extract rooms, structure, and annotations automatically.",
            "请在「勘察智能」上传平面、立面或机电图纸，AI 将自动抽取空间、结构与标注信息。"
          )}
          action={{
            label: t("Go to Survey Intelligence", "前往勘察智能"),
            href: `/projects/${project.id}?section=survey-intelligence`,
          }}
        />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {DRAWING_DISCIPLINE_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors cursor-pointer",
                  filter === tab.id
                    ? "border-copper bg-copper/10 text-copper"
                    : "hover:border-copper/30 text-muted-foreground"
                )}
              >
                {label(tab.labelEn, tab.labelZh)}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-1">
              {t("Overlay", "叠加层")}
            </span>
            {LAYER_TOGGLES.map((layer) => (
              <button
                key={layer.id}
                type="button"
                onClick={() => toggleLayer(layer.id)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] transition-colors cursor-pointer",
                  activeLayers.includes(layer.id)
                    ? "border-copper/50 bg-copper/10"
                    : "text-muted-foreground hover:border-muted-foreground/40"
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", layer.color)} />
                {label(layer.labelEn, layer.labelZh)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-2 max-h-[640px] overflow-y-auto">
              {filtered.map((asset) => {
                const typeLabel = DRAWING_TYPE_LABELS[asset.drawingType];
                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => setSelectedId(asset.id)}
                    className={cn(
                      "w-full text-left rounded-lg border p-3 transition-colors cursor-pointer",
                      selected?.id === asset.id
                        ? "border-copper bg-copper/5 ring-1 ring-copper/30"
                        : "hover:border-copper/30"
                    )}
                  >
                    <p className="text-xs font-medium truncate">{asset.documentName}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {label(typeLabel.en, typeLabel.zh)}
                      {asset.pageNumber > 1 ? ` · p${asset.pageNumber}` : ""}
                      {asset.scale ? ` · ${asset.scale}` : ""}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <ConfidenceBadge confidence={asset.confidence} />
                      <span className="text-[10px] text-muted-foreground truncate">
                        {asset.analysisResult.rooms.length}{" "}
                        {t("rooms", "空间")} · {asset.analysisResult.structuralElements.length}{" "}
                        {t("elements", "构件")}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="lg:col-span-2 space-y-4">
              {selected && (
                <>
                  <DrawingAnalysisOverlayViewer
                    fileUrl={selected.documentFileUrl}
                    mimeType={selected.documentMimeType}
                    analysis={selected.analysisResult}
                    pageNumber={selected.pageNumber}
                    activeLayers={activeLayers}
                    bimPreviewUrl={selected.bimPreviewUrl}
                  />

                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-medium">{selected.documentName}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {selected.analysisResult.summary}
                          </p>
                        </div>
                        <ConfidenceBadge confidence={selected.confidence} />
                      </div>

                      {selected.analysisResult.rooms.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                            {t("Extracted Spaces", "抽取空间")}
                          </h4>
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {selected.analysisResult.rooms.map((room) => (
                              <li
                                key={room.id}
                                className="text-xs rounded border px-2 py-1.5 bg-muted/30"
                              >
                                <span className="font-medium">{room.label}</span>
                                {room.area != null && (
                                  <span className="text-muted-foreground ml-1">
                                    · {room.area} m²
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {selected.analysisResult.structuralElements.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                            {t("Structural Elements", "结构构件")}
                          </h4>
                          <ul className="flex flex-wrap gap-1.5">
                            {selected.analysisResult.structuralElements.map((el, i) => (
                              <li
                                key={el.id ?? `${el.type}-${i}`}
                                className="text-[10px] rounded-full border px-2 py-0.5 bg-blue-500/10 border-blue-500/30"
                              >
                                {el.id ?? el.type}
                                {el.size ? ` ${el.size}` : ""}
                                {el.material ? ` · ${el.material}` : ""}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {selected.analysisResult.annotations.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                            {t("Annotations", "图纸标注")}
                          </h4>
                          <ul className="space-y-1">
                            {selected.analysisResult.annotations.map((note) => (
                              <li key={note.text} className="text-xs text-muted-foreground">
                                · {note.text}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
