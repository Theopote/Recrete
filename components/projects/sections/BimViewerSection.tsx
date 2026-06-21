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
    default:
      return status;
  }
}

export function BimViewerSection({ project }: BimViewerSectionProps) {
  const [models, setModels] = useState<BimModel[]>([]);
  const [selectedId, setSelectedId] = useState<string | "sample">("sample");
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      <SectionHeader
        title="BIM / CAD Viewer"
        description="Import IFC and DWG models, view in 3D (IFC) or 2D preview (DWG conversion)"
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
          {selectedId === "sample" && (
            <IfcModelViewer modelUrl={SAMPLE_IFC_URL} />
          )}

          {selected?.format === "ifc" && selected.status === "ready" && (
            <IfcModelViewer modelUrl={selected.fileUrl} />
          )}

          {selected?.format === "dwg" && selected.status === "ready" && selected.previewUrl && (
            <DwgSvgViewer previewUrl={selected.previewUrl} />
          )}

          {selected?.format === "dwg" && selected.status === "processing" && (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-md border bg-muted/20 gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Converting DWG to preview…</p>
            </div>
          )}

          {selected?.status === "failed" && (
            <div className="flex min-h-[420px] items-center justify-center rounded-md border bg-destructive/5 p-6 text-center">
              <p className="text-xs text-destructive">
                {selected.errorMessage ?? "Model processing failed"}
              </p>
            </div>
          )}

          {(selectedId === "sample" || selected) && (
            <Card>
              <CardContent className="p-4 text-xs text-muted-foreground space-y-2">
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
                      </p>
                    )}
                    {selected.format === "dwg" && selected.previewUrl && (
                      <p>2D SVG preview generated via LibreDWG (P0 lightweight conversion).</p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <BimModelUpload projectId={project.id} onUploaded={handleUploaded} />
    </div>
  );
}
