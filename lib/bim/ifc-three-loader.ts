import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import * as WebIFC from "web-ifc";

export interface IfcLoadResult {
  group: THREE.Group;
  modelId: number;
  close: () => void;
}

function getBufferGeometry(
  ifcApi: WebIFC.IfcAPI,
  modelId: number,
  placedGeometry: WebIFC.PlacedGeometry
) {
  const geometry = ifcApi.GetGeometry(modelId, placedGeometry.geometryExpressID);
  const verts = ifcApi.GetVertexArray(
    geometry.GetVertexData(),
    geometry.GetVertexDataSize()
  );
  const indices = ifcApi.GetIndexArray(
    geometry.GetIndexData(),
    geometry.GetIndexDataSize()
  );

  const buffer = new THREE.BufferGeometry();
  buffer.setAttribute("position", new THREE.BufferAttribute(verts, 3));
  buffer.setIndex(new THREE.BufferAttribute(indices, 1));

  const matrix = new THREE.Matrix4().fromArray(placedGeometry.flatTransformation);
  buffer.applyMatrix4(matrix);

  return buffer;
}

function loadAllGeometry(ifcApi: WebIFC.IfcAPI, modelId: number) {
  const opaqueGeometries: THREE.BufferGeometry[] = [];
  const transparentGeometries: THREE.BufferGeometry[] = [];

  ifcApi.StreamAllMeshes(modelId, (flatMesh) => {
    const placedGeometries = flatMesh.geometries;
    for (let i = 0; i < placedGeometries.size(); i++) {
      const placedGeometry = placedGeometries.get(i);
      const geometry = getBufferGeometry(ifcApi, modelId, placedGeometry);

      if (placedGeometry.color.w !== 1) {
        transparentGeometries.push(geometry);
      } else {
        opaqueGeometries.push(geometry);
      }
    }
  });

  const group = new THREE.Group();

  if (opaqueGeometries.length > 0) {
    const merged = mergeGeometries(opaqueGeometries, false);
    if (merged) {
      const material = new THREE.MeshPhongMaterial({
        side: THREE.DoubleSide,
        vertexColors: false,
        color: 0x94a3b8,
      });
      group.add(new THREE.Mesh(merged, material));
    }
  }

  if (transparentGeometries.length > 0) {
    const merged = mergeGeometries(transparentGeometries, false);
    if (merged) {
      const material = new THREE.MeshPhongMaterial({
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
        color: 0x64748b,
      });
      group.add(new THREE.Mesh(merged, material));
    }
  }

  return group;
}

let ifcApiPromise: Promise<WebIFC.IfcAPI> | null = null;

async function getIfcApi() {
  if (!ifcApiPromise) {
    ifcApiPromise = (async () => {
      const ifcApi = new WebIFC.IfcAPI();
      ifcApi.SetWasmPath("/wasm/web-ifc/", true);
      await ifcApi.Init();
      return ifcApi;
    })();
  }
  return ifcApiPromise;
}

export async function loadIfcFromUrl(url: string): Promise<IfcLoadResult> {
  const ifcApi = await getIfcApi();
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch IFC (${response.status})`);
  }

  const data = new Uint8Array(await response.arrayBuffer());
  const modelId = ifcApi.OpenModel(data, { COORDINATE_TO_ORIGIN: true });
  const group = loadAllGeometry(ifcApi, modelId);

  return {
    group,
    modelId,
    close: () => {
      ifcApi.CloseModel(modelId);
    },
  };
}

export async function loadIfcFromBuffer(buffer: Uint8Array): Promise<IfcLoadResult> {
  const ifcApi = await getIfcApi();
  const modelId = ifcApi.OpenModel(buffer, { COORDINATE_TO_ORIGIN: true });
  const group = loadAllGeometry(ifcApi, modelId);

  return {
    group,
    modelId,
    close: () => {
      ifcApi.CloseModel(modelId);
    },
  };
}
