import * as THREE from "three";
import { buildIfcMeshGroup } from "@/lib/bim/ifc-geometry";
import { openIfcModelFromUrl } from "@/lib/bim/ifc-api-client";

export interface IfcLoadResult {
  group: THREE.Group;
  modelId: number;
  close: () => void;
}

export async function loadIfcFromUrl(url: string): Promise<IfcLoadResult> {
  const session = await openIfcModelFromUrl(url);
  const { group } = buildIfcMeshGroup(session.ifcApi, session.modelId);

  return {
    group,
    modelId: session.modelId,
    close: session.close,
  };
}

export async function loadIfcFromBuffer(buffer: Uint8Array): Promise<IfcLoadResult> {
  const { getBrowserIfcApi } = await import("@/lib/bim/ifc-api-client");
  const ifcApi = await getBrowserIfcApi();
  const modelId = ifcApi.OpenModel(buffer, { COORDINATE_TO_ORIGIN: true });
  const { group } = buildIfcMeshGroup(ifcApi, modelId);

  return {
    group,
    modelId,
    close: () => {
      ifcApi.CloseModel(modelId);
    },
  };
}
