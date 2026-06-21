"use client";

import { useEffect, useRef } from "react";
import { runIfcClientPipeline } from "@/lib/bim/ifc-client-pipeline";
import type { BimModel } from "@/types/bim";

interface IfcLightweightProcessorProps {
  models: BimModel[];
  onUpdated: (model: BimModel) => void;
}

export function IfcLightweightProcessor({ models, onUpdated }: IfcLightweightProcessorProps) {
  const runningRef = useRef(new Set<string>());

  useEffect(() => {
    const pending = models.filter(
      (model) =>
        model.format === "ifc" &&
        model.status === "processing" &&
        !model.gltfUrl &&
        !runningRef.current.has(model.id)
    );

    for (const model of pending) {
      runningRef.current.add(model.id);

      (async () => {
        try {
          const result = await runIfcClientPipeline(model.fileUrl);
          const formData = new FormData();
          formData.append("glb", result.glbBlob, `${model.id}.glb`);
          formData.append("metadata", JSON.stringify(result.metadata));

          const response = await fetch(
            `/api/projects/${model.projectId}/bim-models/${model.id}/lightweight`,
            { method: "POST", body: formData }
          );

          if (!response.ok) {
            throw new Error("Failed to store lightweight preview");
          }

          const updated = (await response.json()) as BimModel;
          onUpdated({
            ...updated,
            createdAt: new Date(updated.createdAt),
            updatedAt: new Date(updated.updatedAt),
          });
        } catch (error) {
          await fetch(`/api/projects/${model.projectId}/bim-models/${model.id}/lightweight`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              failed: true,
              errorMessage:
                error instanceof Error ? error.message : "IFC lightweight conversion failed",
            }),
          }).catch(() => undefined);

          onUpdated({
            ...model,
            status: "failed",
            errorMessage:
              error instanceof Error ? error.message : "IFC lightweight conversion failed",
            updatedAt: new Date(),
          });
        } finally {
          runningRef.current.delete(model.id);
        }
      })();
    }
  }, [models, onUpdated]);

  return null;
}
