import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import type * as THREE from "three";
import { buildIfcMeshGroup } from "@/lib/bim/ifc-geometry";
import { openIfcModelFromUrl } from "@/lib/bim/ifc-api-client";
import { extractIfcSpaces } from "@/lib/bim/ifc-spatial";
import type { BimModelMetadata } from "@/types/bim";

export interface IfcClientPipelineResult {
  glbBlob: Blob;
  metadata: BimModelMetadata;
}

function exportGroupToGlb(group: THREE.Group): Promise<ArrayBuffer> {
  const exporter = new GLTFExporter();
  return new Promise((resolve, reject) => {
    exporter.parse(
      group,
      (result) => {
        if (result instanceof ArrayBuffer) {
          resolve(result);
          return;
        }
        reject(new Error("GLTF export did not return binary output"));
      },
      (error) => {
        reject(error instanceof Error ? error : new Error("GLTF export failed"));
      },
      { binary: true }
    );
  });
}

export async function runIfcClientPipeline(modelUrl: string): Promise<IfcClientPipelineResult> {
  const session = await openIfcModelFromUrl(modelUrl);

  try {
    const { group, meshCount } = buildIfcMeshGroup(session.ifcApi, session.modelId);
    const rooms = await extractIfcSpaces(session.ifcApi, session.modelId);
    const totalArea = rooms.reduce((sum, room) => sum + room.area, 0);
    const glbBuffer = await exportGroupToGlb(group);

    return {
      glbBlob: new Blob([glbBuffer], { type: "model/gltf-binary" }),
      metadata: {
        meshCount,
        rooms,
        totalArea: totalArea > 0 ? Math.round(totalArea * 100) / 100 : undefined,
        totalAreaUnit: totalArea > 0 ? "m2" : undefined,
      },
    };
  } finally {
    session.close();
  }
}
