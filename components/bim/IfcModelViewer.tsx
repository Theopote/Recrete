"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import * as OBC from "@thatopen/components";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface IfcModelViewerProps {
  modelUrl: string;
  className?: string;
}

export function IfcModelViewer({ modelUrl, className }: IfcModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let components: OBC.Components | null = null;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        components = new OBC.Components();
        const worlds = components.get(OBC.Worlds);
        const world = worlds.create<
          OBC.SimpleScene,
          OBC.SimpleCamera,
          OBC.SimpleRenderer
        >();

        world.scene = new OBC.SimpleScene(components);
        world.renderer = new OBC.SimpleRenderer(components, container);
        world.camera = new OBC.SimpleCamera(components);
        components.init();

        world.scene.setup();
        world.scene.three.background = new THREE.Color("#f1f5f9");

        const ifcLoader = components.get(OBC.IfcLoader);
        await ifcLoader.setup({
          autoSetWasm: false,
          wasm: {
            path: "/wasm/web-ifc/",
            absolute: true,
          },
        });

        const response = await fetch(modelUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch IFC (${response.status})`);
        }

        const buffer = new Uint8Array(await response.arrayBuffer());
        const model = await ifcLoader.load(buffer, true, "recrete-model");
        world.scene.three.add(model);

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z, 1);
        const distance = maxDim * 2.2;

        await world.camera.controls.setLookAt(
          center.x + distance,
          center.y + distance * 0.6,
          center.z + distance,
          center.x,
          center.y,
          center.z,
          true
        );

        if (!disposed) setLoading(false);
      } catch (err) {
        if (!disposed) {
          setError(err instanceof Error ? err.message : "Failed to load IFC model");
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      disposed = true;
      components?.dispose();
      if (container) container.innerHTML = "";
    };
  }, [modelUrl]);

  return (
    <div className={cn("relative h-full min-h-[420px] w-full rounded-md border bg-muted/20", className)}>
      <div ref={containerRef} className="absolute inset-0" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}
