"use client";

import { useCallback, useEffect, useState } from "react";
import { BimSpatialAnalyticsPanel } from "@/components/bim/BimSpatialAnalyticsPanel";
import type { RenovationStrategy } from "@/types";
import type { BimModel } from "@/types/bim";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";

interface StrategySpatialCompareSectionProps {
  projectId: string;
  strategies: RenovationStrategy[];
}

export function StrategySpatialCompareSection({
  projectId,
  strategies,
}: StrategySpatialCompareSectionProps) {
  const [models, setModels] = useState<BimModel[]>([]);
  const [loading, setLoading] = useState(true);

  const loadModels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/bim-models`);
      if (res.ok) {
        const data = await res.json();
        setModels(
          (data.models as BimModel[]).map((model) => ({
            ...model,
            createdAt: new Date(model.createdAt),
            updatedAt: new Date(model.updatedAt),
          }))
        );
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  const readyModel =
    models.find(
      (model) =>
        model.status === "ready" &&
        (model.metadata?.rooms?.length ?? 0) > 0 &&
        (model.gltfUrl || model.fileUrl || model.previewUrl)
    ) ?? null;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex min-h-[120px] items-center justify-center p-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!readyModel) {
    return (
      <Card>
        <CardContent className="p-4 text-xs text-muted-foreground">
          Upload a BIM/CAD model with detected rooms in BIM Viewer to enable strategy before/after
          3D comparison and spatial cost heatmaps.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Spatial Strategy Compare
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Before/after 3D preview, circulation paths, and per-room cost heatmap using{" "}
          <span className="font-medium text-foreground">{readyModel.name}</span>
        </p>
      </div>
      <BimSpatialAnalyticsPanel
        projectId={projectId}
        model={readyModel}
        strategies={strategies}
      />
    </div>
  );
}
