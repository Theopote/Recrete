"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { openIfcModelFromUrl } from "@/lib/bim/ifc-api-client";
import { buildExpressIdMeshGroup, buildIfcMeshGroup } from "@/lib/bim/ifc-geometry";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/use-locale";

interface IfcClashHighlightViewerProps {
  modelUrl: string;
  highlightExpressIds?: number[];
  className?: string;
}

export function IfcClashHighlightViewer({
  modelUrl,
  highlightExpressIds = [],
  className,
}: IfcClashHighlightViewerProps) {
  const { t } = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let animationId = 0;
    let closeModel: (() => void) | null = null;
    let highlightGroup: THREE.Group | null = null;

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
        const session = await openIfcModelFromUrl(modelUrl);
        if (disposed) {
          session.close();
          return;
        }
        closeModel = session.close;

        const { group } = buildIfcMeshGroup(session.ifcApi, session.modelId);
        scene.add(group);

        if (highlightExpressIds.length > 0) {
          highlightGroup = buildExpressIdMeshGroup(
            session.ifcApi,
            session.modelId,
            highlightExpressIds
          );
          scene.add(highlightGroup);
        }

        const box = new THREE.Box3().setFromObject(scene);
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
          setError(err instanceof Error ? err.message : t("Failed to load IFC model", "IFC 模型加载失败"));
          setLoading(false);
        }
      }
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", onResize);
      closeModel?.();
      highlightGroup?.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((material) => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      controls.dispose();
      renderer.dispose();
      container.innerHTML = "";
    };
  }, [modelUrl, highlightExpressIds, t]);

  return (
    <div className={cn("relative min-h-[320px] overflow-hidden rounded-md border bg-muted/20", className)}>
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
      <div ref={containerRef} className="h-full min-h-[320px] w-full" />
    </div>
  );
}
