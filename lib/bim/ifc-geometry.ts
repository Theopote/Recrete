import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type * as WebIFC from "web-ifc";

export function bufferGeometryFromPlacedMesh(
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

export function buildIfcMeshGroup(ifcApi: WebIFC.IfcAPI, modelId: number) {
  const opaqueGeometries: THREE.BufferGeometry[] = [];
  const transparentGeometries: THREE.BufferGeometry[] = [];
  let meshCount = 0;

  ifcApi.StreamAllMeshes(modelId, (flatMesh) => {
    meshCount += 1;
    const placedGeometries = flatMesh.geometries;
    for (let i = 0; i < placedGeometries.size(); i++) {
      const placedGeometry = placedGeometries.get(i);
      const geometry = bufferGeometryFromPlacedMesh(ifcApi, modelId, placedGeometry);

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
      const material = new THREE.MeshStandardMaterial({
        side: THREE.DoubleSide,
        color: 0x94a3b8,
        metalness: 0.05,
        roughness: 0.85,
      });
      group.add(new THREE.Mesh(merged, material));
    }
  }

  if (transparentGeometries.length > 0) {
    const merged = mergeGeometries(transparentGeometries, false);
    if (merged) {
      const material = new THREE.MeshStandardMaterial({
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
        color: 0x64748b,
        metalness: 0.05,
        roughness: 0.85,
      });
      group.add(new THREE.Mesh(merged, material));
    }
  }

  return { group, meshCount };
}

export function computeProjectedMeshArea(geometry: THREE.BufferGeometry) {
  const position = geometry.getAttribute("position");
  const index = geometry.getIndex();
  if (!position || !index) return 0;

  let area = 0;
  for (let i = 0; i < index.count; i += 3) {
    const a = index.getX(i);
    const b = index.getX(i + 1);
    const c = index.getX(i + 2);

    const ax = position.getX(a);
    const ay = position.getY(a);
    const bx = position.getX(b);
    const by = position.getY(b);
    const cx = position.getX(c);
    const cy = position.getY(c);

    area += Math.abs((bx - ax) * (cy - ay) - (cx - ax) * (by - ay)) * 0.5;
  }

  return area;
}
