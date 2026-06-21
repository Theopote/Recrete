"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface OpenBimViewerProps {
  modelUrl: string;
  className?: string;
}

/**
 * That Open Components (@thatopen/components) IFC viewer — openbim-components v2 lineage.
 */
export function OpenBimViewer({ modelUrl, className }: OpenBimViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let components: import("@thatopen/components").Components | null = null;

    async function init() {
      try {
        const OBC = await import("@thatopen/components");
        const THREE = await import("three");

        components = new OBC.Components();
        components.init();

        const worlds = components.get(OBC.Worlds);
        const world = worlds.create();

        const scene = new OBC.SimpleScene(components);
        scene.setup();
        world.scene = scene;
        world.renderer = new OBC.SimpleRenderer(components, container!);
        world.camera = new OBC.OrthoPerspectiveCamera(components);

        components.get(OBC.Grids).create(world);

        const ifcLoader = components.get(OBC.IfcLoader);
        await ifcLoader.setup({
          autoSetWasm: true,
          wasm: { path: "/wasm/web-ifc/", absolute: true },
        });

        const absoluteUrl = modelUrl.startsWith("http")
          ? modelUrl
          : `${window.location.origin}${modelUrl}`;

        const response = await fetch(absoluteUrl);
        if (!response.ok) throw new Error(`Failed to fetch IFC (${response.status})`);
        const buffer = await response.arrayBuffer();

        const model = await ifcLoader.load(new Uint8Array(buffer));
        world.scene.three.add(model);

        const bbox = new THREE.Box3().setFromObject(model);
        const center = bbox.getCenter(new THREE.Vector3());
        const size = bbox.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z, 1);

        await world.camera.controls?.setLookAt(
          center.x + maxDim,
          center.y + maxDim * 0.6,
          center.z + maxDim,
          center.x,
          center.y,
          center.z,
          true
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
      components?.dispose();
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
