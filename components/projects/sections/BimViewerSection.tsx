"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { SectionHeader } from "@/components/app/SectionHeader";
import { BimModelUpload, BimModelUploadButton, type BimModelUploadResponse } from "@/components/bim/BimModelUpload";
import { DwgSvgViewer } from "@/components/bim/DwgSvgViewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SAMPLE_IFC_URL } from "@/lib/bim/formats";
import type { BimModel } from "@/types/bim";
import type { ProjectWithRelations } from "@/types";
import { Box, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { RoleGate } from "@/components/auth/RoleGate";
import { BimSpatialAnalyticsPanel } from "@/components/bim/BimSpatialAnalyticsPanel";
import { IfcLightweightProcessor } from "@/components/bim/IfcLightweightProcessor";
import { MepIfcClashPanel } from "@/components/bim/MepIfcClashPanel";
import { useLocale } from "@/lib/i18n/use-locale";

const IfcModelViewer = dynamic(
  () => import("@/components/bim/IfcModelViewer").then((m) => m.IfcModelViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[420px] items-center justify-center rounded-md border bg-muted/20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

const GltfModelViewer = dynamic(
  () => import("@/components/bim/GltfModelViewer").then((m) => m.GltfModelViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[420px] items-center justify-center rounded-md border bg-muted/20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

const OpenBimViewer = dynamic(
  () => import("@/components/bim/OpenBimViewer").then((m) => m.OpenBimViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[420px] items-center justify-center rounded-md border bg-muted/20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

interface BimViewerSectionProps {
  project: ProjectWithRelations;
}

function statusLabel(status: BimModel["status"], t: (en: string, zh?: string) => string) {
  switch (status) {
    case "ready":
      return t("Ready", "就绪");
    case "processing":
      return t("Converting…", "转换中…");
    case "failed":
      return t("Failed", "失败");
    case "unsupported":
      return t("Unsupported", "不支持");
    default:
      return status;
  }
}

function isCadFormat(format: BimModel["format"]) {
  return format === "dwg" || format === "dxf";
}

function RoomTable({ model }: { model: BimModel }) {
  const { t } = useLocale();
  const rooms = model.metadata?.rooms ?? [];
  if (rooms.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="font-medium text-foreground">
        {t("Rooms / areas", "房间 / 面积")}
        {model.metadata?.totalArea != null && (
          <span className="ml-2 font-normal text-muted-foreground">
            {t("Total", "合计")} {model.metadata.totalArea.toFixed(2)} m²
          </span>
        )}
      </p>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-left">
          <thead className="bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">{t("Room", "房间")}</th>
              <th className="px-3 py-2">{t("Area (m²)", "面积 (m²)")}</th>
              <th className="px-3 py-2">{t("Source", "来源")}</th>
            </tr>
          </thead>
          <tbody>
            {rooms.slice(0, 12).map((room) => (
              <tr key={room.id} className="border-t">
                <td className="px-3 py-2">{room.label}</td>
                <td className="px-3 py-2">{room.area.toFixed(2)}</td>
                <td className="px-3 py-2 text-muted-foreground">{room.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rooms.length > 12 && (
        <p className="text-[10px] text-muted-foreground">
          {t(`Showing 12 of ${rooms.length} rooms.`, `显示 ${rooms.length} 个房间中的 12 个。`)}
        </p>
      )}
    </div>
  );
}

export function BimViewerSection({ project }: BimViewerSectionProps) {
  const { t } = useLocale();
  const [models, setModels] = useState<BimModel[]>([]);
  const [selectedId, setSelectedId] = useState<string | "sample">("sample");
  const [loading, setLoading] = useState(true);
  const [viewerEngine, setViewerEngine] = useState<"web-ifc" | "openbim">("web-ifc");

  const loadModels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/bim-models`);
      if (res.ok) {
        const data = await res.json();
        const list = (data.models as BimModel[]).map((m) => ({
          ...m,
          createdAt: new Date(m.createdAt),
          updatedAt: new Date(m.updatedAt),
        }));
        setModels(list);
      }
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  useEffect(() => {
    const hasProcessing = models.some((m) => m.status === "processing");
    if (!hasProcessing) return;
    const timer = setInterval(loadModels, 3000);
    return () => clearInterval(timer);
  }, [models, loadModels]);

  const selected =
    selectedId === "sample"
      ? null
      : models.find((m) => m.id === selectedId) ?? null;

  const handleUploaded = (model: BimModelUploadResponse) => {
    setModels((prev) => [model, ...prev]);
    setSelectedId(model.id);
  };

  const handleModelUpdated = (model: BimModel) => {
    setModels((prev) => prev.map((item) => (item.id === model.id ? model : item)));
  };

  const conversionMessage =
    selected?.format === "ifc"
      ? t(
          "Generating lightweight GLB preview and extracting IFC spaces…",
          "正在生成轻量 GLB 预览并提取 IFC 空间…"
        )
      : selected && isCadFormat(selected.format)
        ? t(
            `Converting ${selected.format.toUpperCase()} to SVG preview and detecting room areas…`,
            `正在将 ${selected.format.toUpperCase()} 转换为 SVG 预览并检测房间面积…`
          )
        : t("Converting model…", "正在转换模型…");

  return (
    <div className="space-y-6">
      <IfcLightweightProcessor models={models} onUpdated={handleModelUpdated} />
      <SectionHeader
        title="BIM / CAD Viewer"
        titleZh="BIM / CAD 查看器"
        description="Import IFC, DWG, or DXF — circulation analysis, spatial cost heatmap, strategy 3D compare"
        descriptionZh="导入 IFC、DWG 或 DXF — 动线分析、空间成本热力图、方案三维对比"
        action={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={loadModels} disabled={loading}>
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              {t("Refresh", "刷新")}
            </Button>
            <RoleGate action="upload_documents">
              <BimModelUploadButton projectId={project.id} onUploaded={handleUploaded} />
            </RoleGate>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        <Card>
          <CardContent className="p-3 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("Models", "模型")}
            </p>
            <button
              type="button"
              onClick={() => setSelectedId("sample")}
              className={`w-full rounded-md px-2.5 py-2 text-left text-xs transition-colors ${
                selectedId === "sample"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-foreground"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Box className="h-3.5 w-3.5 shrink-0" />
                {t("Sample IFC (demo)", "示例 IFC（演示）")}
              </span>
            </button>
            {models.map((model) => (
              <button
                key={model.id}
                type="button"
                onClick={() => setSelectedId(model.id)}
                className={`w-full rounded-md px-2.5 py-2 text-left text-xs transition-colors ${
                  selectedId === model.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                <div className="truncate font-medium">{model.name}</div>
                <div className="mt-1 flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[9px] uppercase">
                    {model.format}
                  </Badge>
                  <span className="text-[10px] opacity-80">{statusLabel(model.status, t)}</span>
                </div>
              </button>
            ))}
            {models.length === 0 && !loading && (
              <p className="text-[10px] text-muted-foreground px-1">
                {t("No models uploaded yet.", "尚未上传模型。")}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={viewerEngine === "web-ifc" ? "default" : "outline"}
              onClick={() => setViewerEngine("web-ifc")}
            >
              {t("web-ifc Viewer", "web-ifc 查看器")}
            </Button>
            <Button
              size="sm"
              variant={viewerEngine === "openbim" ? "default" : "outline"}
              onClick={() => setViewerEngine("openbim")}
            >
              {t("OpenBIM Components", "OpenBIM 组件")}
            </Button>
          </div>

          {selectedId === "sample" && viewerEngine === "openbim" && (
            <OpenBimViewer modelUrl={SAMPLE_IFC_URL} />
          )}
          {selectedId === "sample" && viewerEngine === "web-ifc" && (
            <IfcModelViewer modelUrl={SAMPLE_IFC_URL} />
          )}

          {selected?.format === "ifc" && selected.status === "ready" && selected.gltfUrl && viewerEngine === "web-ifc" && (
            <GltfModelViewer modelUrl={selected.gltfUrl} />
          )}

          {selected?.format === "ifc" &&
            selected.status === "ready" &&
            !selected.gltfUrl &&
            selected.fileUrl &&
            viewerEngine === "web-ifc" && <IfcModelViewer modelUrl={selected.fileUrl} />}

          {selected?.format === "ifc" &&
            selected.status === "ready" &&
            selected.fileUrl &&
            viewerEngine === "openbim" && <OpenBimViewer modelUrl={selected.fileUrl} />}

          {selected?.format === "ifc" && selected.status === "processing" && selected.fileUrl && (
            <>
              <IfcModelViewer modelUrl={selected.fileUrl} />
              <div className="flex items-center gap-2 rounded-md border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {conversionMessage}
              </div>
            </>
          )}

          {selected &&
            isCadFormat(selected.format) &&
            selected.status === "ready" &&
            selected.previewUrl && <DwgSvgViewer previewUrl={selected.previewUrl} />}

          {selected &&
            isCadFormat(selected.format) &&
            selected.status === "processing" && (
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-md border bg-muted/20 gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{conversionMessage}</p>
              </div>
            )}

          {(selected?.status === "failed" || selected?.status === "unsupported") && (
            <div className="flex min-h-[420px] items-center justify-center rounded-md border bg-destructive/5 p-6 text-center">
              <p className="text-xs text-destructive">
                {selected.errorMessage ?? t("Model processing failed", "模型处理失败")}
              </p>
            </div>
          )}

          {(selectedId === "sample" || selected) && (
            <Card>
              <CardContent className="p-4 text-xs text-muted-foreground space-y-3">
                {selectedId === "sample" && (
                  <>
                    <p>{t("Demo model loaded from That Open sample library.", "演示模型来自 That Open 示例库。")}</p>
                    <a
                      href={SAMPLE_IFC_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      {t("Open source file", "打开源文件")} <ExternalLink className="h-3 w-3" />
                    </a>
                  </>
                )}
                {selected && (
                  <>
                    <p>
                      <span className="font-medium text-foreground">{selected.name}</span>
                      {" · "}
                      {(selected.fileSize / 1024).toFixed(0)} KB
                    </p>
                    {selected.metadata?.entityCount !== undefined && (
                      <p>
                        {t("Entities:", "实体：")} {selected.metadata.entityCount}
                        {selected.metadata.layerCount !== undefined &&
                          ` · ${t("Layers:", "图层：")} ${selected.metadata.layerCount}`}
                        {selected.metadata.meshCount !== undefined &&
                          ` · ${t("Meshes:", "网格：")} ${selected.metadata.meshCount}`}
                      </p>
                    )}
                    {selected.format === "ifc" && selected.gltfUrl && (
                      <p>
                        {t(
                          "Lightweight GLB preview generated from IFC geometry.",
                          "已从 IFC 几何生成轻量 GLB 预览。"
                        )}
                      </p>
                    )}
                    {selected && isCadFormat(selected.format) && selected.previewUrl && (
                      <p>
                        {t(
                          `2D SVG preview generated via LibreDWG (${selected.format.toUpperCase()}).`,
                          `通过 LibreDWG 生成 2D SVG 预览（${selected.format.toUpperCase()}）。`
                        )}
                      </p>
                    )}
                    <RoomTable model={selected} />
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {selected?.status === "ready" && (selected.metadata?.rooms?.length ?? 0) > 0 && (
            <BimSpatialAnalyticsPanel
              projectId={project.id}
              model={selected}
              strategies={project.strategies ?? []}
            />
          )}

          {selected?.format === "ifc" && selected.status === "ready" && selected.fileUrl && (
            <MepIfcClashPanel
              projectId={project.id}
              model={selected}
              onComplete={() => loadModels()}
            />
          )}
        </div>
      </div>

      <RoleGate action="upload_documents">
        <BimModelUpload projectId={project.id} onUploaded={handleUploaded} />
      </RoleGate>
    </div>
  );
}
