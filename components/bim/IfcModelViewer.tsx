"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { loadIfcFromUrl } from "@/lib/bim/ifc-three-loader";
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
    let animationId = 0;
    let closeModel: (() => void) | null = null;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#11151b");

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      10000
    );
    camera.position.set(12, 8, 12);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const dir = new THREE.DirectionalLight(0xffffff, 0.85);
    dir.position.set(10, 20, 10);
    scene.add(dir);

    const grid = new THREE.GridHelper(40, 40, 0x4b5563, 0x242a33);
    scene.add(grid);

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", onResize);

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await loadIfcFromUrl(modelUrl);
        if (disposed) {
          result.close();
          return;
        }
        closeModel = result.close;
        scene.add(result.group);

        const box = new THREE.Box3().setFromObject(result.group);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z, 1);
        controls.target.copy(center);
        camera.position.set(
          center.x + maxDim * 1.6,
          center.y + maxDim * 0.8,
          center.z + maxDim * 1.6
        );
        controls.update();
        setLoading(false);
      } catch (err) {
        if (!disposed) {
          setError(err instanceof Error ? err.message : "Failed to load IFC model");
          setLoading(false);
        }
      }
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", onResize);
      closeModel?.();
      controls.dispose();
      renderer.dispose();
      container.innerHTML = "";
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
