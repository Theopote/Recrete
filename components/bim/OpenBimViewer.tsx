"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface OpenBimViewerProps {
  modelUrl: string;
  className?: string;
}

/**
 * That Open / openbim-components IFC viewer (alternative to raw web-ifc loader).
 */
export function OpenBimViewer({ modelUrl, className }: OpenBimViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;

    async function init() {
      try {
        const OBC = await import("@thatopen/components");
        const THREE = await import("three");

        const components = new OBC.Components();
        components.scene = new OBC.SimpleScene(components);
        components.renderer = new OBC.SimpleRenderer(components, container!);
        components.camera = new OBC.OrthoPerspectiveCamera(components);
        await components.init();

        const sceneComponent = components.get(OBC.SimpleScene);
        sceneComponent.setup();
        components.get(OBC.Grids).create();

        const ifcLoader = components.get(OBC.IfcLoader);
        await ifcLoader.setup({
          wasm: { path: "/wasm/web-ifc/", absolute: true },
        });

        const absoluteUrl = modelUrl.startsWith("http")
          ? modelUrl
          : `${window.location.origin}${modelUrl}`;

        const model = await ifcLoader.load(absoluteUrl);
        sceneComponent.three.add(model);

        const bbox = new THREE.Box3().setFromObject(model);
        const center = bbox.getCenter(new THREE.Vector3());
        components.get(OBC.OrthoPerspectiveCamera).controls.setLookAt(
          center.x + 20,
          center.y + 20,
          center.z + 20,
          center.x,
          center.y,
          center.z
        );

        if (!disposed) setLoading(false);
      } catch (err) {
        console.error("OpenBIM viewer error:", err);
        if (!disposed) {
          setError(err instanceof Error ? err.message : "Failed to load OpenBIM viewer");
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      disposed = true;
    };
  }, [modelUrl]);

  return (
    <div className={cn("relative min-h-[420px] overflow-hidden rounded-md border bg-muted/20", className)}>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-4 text-center text-xs text-destructive">
          {error}
        </div>
      )}
      <div ref={containerRef} className="h-full min-h-[420px] w-full" />
    </div>
  );
}
