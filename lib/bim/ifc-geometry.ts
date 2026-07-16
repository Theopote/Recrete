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

export interface Bbox3D {
  min: { x: number; y: number; z: number };
  max: { x: number; y: number; z: number };
}

export function computeExpressIdBbox3D(
  ifcApi: WebIFC.IfcAPI,
  modelId: number,
  expressId: number
): Bbox3D | null {
  const geometries: THREE.BufferGeometry[] = [];

  const collect = (flatMesh: WebIFC.FlatMesh) => {
    const placedGeometries = flatMesh.geometries;
    for (let i = 0; i < placedGeometries.size(); i++) {
      geometries.push(bufferGeometryFromPlacedMesh(ifcApi, modelId, placedGeometries.get(i)));
    }
  };

  ifcApi.StreamMeshes(modelId, [expressId], collect);

  if (geometries.length === 0) {
    const flatMesh = ifcApi.GetFlatMesh(modelId, expressId);
    collect(flatMesh);
    flatMesh.delete();
  }

  if (geometries.length === 0) return null;

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;

  for (const geometry of geometries) {
    const position = geometry.getAttribute("position");
    if (!position) continue;
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      const z = position.getZ(i);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      minZ = Math.min(minZ, z);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      maxZ = Math.max(maxZ, z);
    }
    geometry.dispose();
  }

  if (!Number.isFinite(minX)) return null;
  return {
    min: { x: minX, y: minY, z: minZ },
    max: { x: maxX, y: maxY, z: maxZ },
  };
}

export function buildExpressIdMeshGroup(
  ifcApi: WebIFC.IfcAPI,
  modelId: number,
  expressIds: number[],
  color = 0xef4444
) {
  const geometries: THREE.BufferGeometry[] = [];

  for (const expressId of expressIds) {
    ifcApi.StreamMeshes(modelId, [expressId], (flatMesh) => {
      const placedGeometries = flatMesh.geometries;
      for (let i = 0; i < placedGeometries.size(); i++) {
        geometries.push(
          bufferGeometryFromPlacedMesh(ifcApi, modelId, placedGeometries.get(i))
        );
      }
    });
  }

  const group = new THREE.Group();
  if (geometries.length === 0) return group;

  const merged = mergeGeometries(geometries, false);
  geometries.forEach((geometry) => geometry.dispose());
  if (!merged) return group;

  const material = new THREE.MeshStandardMaterial({
    color,
    transparent: true,
    opacity: 0.88,
    depthTest: true,
  });
  group.add(new THREE.Mesh(merged, material));
  return group;
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
