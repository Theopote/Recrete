"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { SectionHeader } from "@/components/app/SectionHeader";
import { BimModelUpload, BimModelUploadButton } from "@/components/bim/BimModelUpload";
import { DwgSvgViewer } from "@/components/bim/DwgSvgViewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SAMPLE_IFC_URL } from "@/lib/bim/formats";
import type { BimModel } from "@/types/bim";
import type { ProjectWithRelations } from "@/types";
import { Box, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { BimSpatialAnalyticsPanel } from "@/components/bim/BimSpatialAnalyticsPanel";
import { IfcLightweightProcessor } from "@/components/bim/IfcLightweightProcessor";

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

function statusLabel(status: BimModel["status"]) {
  switch (status) {
    case "ready":
      return "Ready";
    case "processing":
      return "Converting…";
    case "failed":
      return "Failed";
    case "unsupported":
      return "Unsupported";
    default:
      return status;
  }
}

function isCadFormat(format: BimModel["format"]) {
  return format === "dwg" || format === "dxf";
}

function RoomTable({ model }: { model: BimModel }) {
  const rooms = model.metadata?.rooms ?? [];
  if (rooms.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="font-medium text-foreground">
        Rooms / areas
        {model.metadata?.totalArea != null && (
          <span className="ml-2 font-normal text-muted-foreground">
            Total {model.metadata.totalArea.toFixed(2)} m²
          </span>
        )}
      </p>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-left">
          <thead className="bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Room</th>
              <th className="px-3 py-2">Area (m²)</th>
              <th className="px-3 py-2">Source</th>
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
        <p className="text-[10px] text-muted-foreground">Showing 12 of {rooms.length} rooms.</p>
      )}
    </div>
  );
}

export function BimViewerSection({ project }: BimViewerSectionProps) {
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

  const handleUploaded = (model: BimModel) => {
    setModels((prev) => [model, ...prev]);
    setSelectedId(model.id);
  };

  const handleModelUpdated = (model: BimModel) => {
    setModels((prev) => prev.map((item) => (item.id === model.id ? model : item)));
  };

  const conversionMessage =
    selected?.format === "ifc"
      ? "Generating lightweight GLB preview and extracting IFC spaces…"
      : selected && isCadFormat(selected.format)
        ? `Converting ${selected.format.toUpperCase()} to SVG preview and detecting room areas…`
        : "Converting model…";

  return (
    <div className="space-y-6">
      <IfcLightweightProcessor models={models} onUpdated={handleModelUpdated} />
      <SectionHeader
        title="BIM / CAD Viewer"
        description="Import IFC, DWG, or DXF — circulation analysis, spatial cost heatmap, strategy 3D compare"
        action={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={loadModels} disabled={loading}>
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <BimModelUploadButton projectId={project.id} onUploaded={handleUploaded} />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        <Card>
          <CardContent className="p-3 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Models
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
                Sample IFC (demo)
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
                  <span className="text-[10px] opacity-80">{statusLabel(model.status)}</span>
                </div>
              </button>
            ))}
            {models.length === 0 && !loading && (
              <p className="text-[10px] text-muted-foreground px-1">No models uploaded yet.</p>
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
              web-ifc Viewer
            </Button>
            <Button
              size="sm"
              variant={viewerEngine === "openbim" ? "default" : "outline"}
              onClick={() => setViewerEngine("openbim")}
            >
              OpenBIM Components
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
                {selected.errorMessage ?? "Model processing failed"}
              </p>
            </div>
          )}

          {(selectedId === "sample" || selected) && (
            <Card>
              <CardContent className="p-4 text-xs text-muted-foreground space-y-3">
                {selectedId === "sample" && (
                  <>
                    <p>Demo model loaded from That Open sample library.</p>
                    <a
                      href={SAMPLE_IFC_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      Open source file <ExternalLink className="h-3 w-3" />
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
                        Entities: {selected.metadata.entityCount}
                        {selected.metadata.layerCount !== undefined &&
                          ` · Layers: ${selected.metadata.layerCount}`}
                        {selected.metadata.meshCount !== undefined &&
                          ` · Meshes: ${selected.metadata.meshCount}`}
                      </p>
                    )}
                    {selected.format === "ifc" && selected.gltfUrl && (
                      <p>Lightweight GLB preview generated from IFC geometry.</p>
                    )}
                    {selected && isCadFormat(selected.format) && selected.previewUrl && (
                      <p>
                        2D SVG preview generated via LibreDWG ({selected.format.toUpperCase()}).
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
        </div>
      </div>

      <BimModelUpload projectId={project.id} onUploaded={handleUploaded} />
    </div>
  );
}
