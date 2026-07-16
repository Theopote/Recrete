import { bi } from "@/lib/i18n/bilingual";
import type {
  MepClashItem,
  MepClashReport,
  MepClashSeverity,
} from "@/lib/ai/agents/mep-agent";
import type { BimBoundingBox3D, BimIfcElement, BimIfcDiscipline } from "@/types/bim";

const MEP_DISCIPLINES = new Set<BimIfcDiscipline>(["hvac", "plumbing", "electrical", "other"]);

export interface IfcAabbClashPair {
  id: string;
  elementA: BimIfcElement;
  elementB: BimIfcElement;
  overlapVolume: number;
  centroid: { x: number; y: number; z: number };
}

export interface DetectIfcAabbClashOptions {
  clearanceMm?: number;
  maxClashes?: number;
}

function bboxVolume(bbox: BimBoundingBox3D): number {
  return (
    Math.max(0, bbox.max.x - bbox.min.x) *
    Math.max(0, bbox.max.y - bbox.min.y) *
    Math.max(0, bbox.max.z - bbox.min.z)
  );
}

function expandBbox(bbox: BimBoundingBox3D, marginM: number): BimBoundingBox3D {
  return {
    min: {
      x: bbox.min.x - marginM,
      y: bbox.min.y - marginM,
      z: bbox.min.z - marginM,
    },
    max: {
      x: bbox.max.x + marginM,
      y: bbox.max.y + marginM,
      z: bbox.max.z + marginM,
    },
  };
}

export function aabbIntersects(a: BimBoundingBox3D, b: BimBoundingBox3D): boolean {
  return (
    a.min.x <= b.max.x &&
    a.max.x >= b.min.x &&
    a.min.y <= b.max.y &&
    a.max.y >= b.min.y &&
    a.min.z <= b.max.z &&
    a.max.z >= b.min.z
  );
}

export function computeOverlapVolume(a: BimBoundingBox3D, b: BimBoundingBox3D): number {
  const minX = Math.max(a.min.x, b.min.x);
  const minY = Math.max(a.min.y, b.min.y);
  const minZ = Math.max(a.min.z, b.min.z);
  const maxX = Math.min(a.max.x, b.max.x);
  const maxY = Math.min(a.max.y, b.max.y);
  const maxZ = Math.min(a.max.z, b.max.z);

  const dx = maxX - minX;
  const dy = maxY - minY;
  const dz = maxZ - minZ;
  if (dx <= 0 || dy <= 0 || dz <= 0) return 0;
  return dx * dy * dz;
}

function isRelevantPair(a: BimIfcElement, b: BimIfcElement): boolean {
  const aMep = MEP_DISCIPLINES.has(a.discipline);
  const bMep = MEP_DISCIPLINES.has(b.discipline);
  if (aMep && bMep) return true;
  if (aMep && b.discipline === "structure") return true;
  if (bMep && a.discipline === "structure") return true;
  return false;
}

function severityFromOverlap(
  overlapVolume: number,
  elementA: BimIfcElement,
  elementB: BimIfcElement
): MepClashSeverity {
  const minElementVolume = Math.min(
    Math.max(bboxVolume(elementA.bbox), 1e-6),
    Math.max(bboxVolume(elementB.bbox), 1e-6)
  );
  const ratio = overlapVolume / minElementVolume;
  if (ratio > 0.35) return "critical";
  if (ratio > 0.12) return "high";
  if (ratio > 0.03) return "medium";
  return "low";
}

export function detectIfcAabbClashes(
  elements: BimIfcElement[],
  options: DetectIfcAabbClashOptions = {}
): IfcAabbClashPair[] {
  const clearanceM = (options.clearanceMm ?? 25) / 1000;
  const maxClashes = options.maxClashes ?? 80;
  const clashes: IfcAabbClashPair[] = [];

  for (let i = 0; i < elements.length; i++) {
    const a = elements[i];
    const aBox = expandBbox(a.bbox, clearanceM);

    for (let j = i + 1; j < elements.length; j++) {
      const b = elements[j];
      if (!isRelevantPair(a, b)) continue;

      const bBox = expandBbox(b.bbox, clearanceM);
      if (!aabbIntersects(aBox, bBox)) continue;

      const overlapVolume = computeOverlapVolume(a.bbox, b.bbox);
      if (overlapVolume <= 0) continue;

      const centroid = {
        x: (Math.max(a.bbox.min.x, b.bbox.min.x) + Math.min(a.bbox.max.x, b.bbox.max.x)) / 2,
        y: (Math.max(a.bbox.min.y, b.bbox.min.y) + Math.min(a.bbox.max.y, b.bbox.max.y)) / 2,
        z: (Math.max(a.bbox.min.z, b.bbox.min.z) + Math.min(a.bbox.max.z, b.bbox.max.z)) / 2,
      };

      clashes.push({
        id: `ifc-clash-${a.expressId}-${b.expressId}`,
        elementA: a,
        elementB: b,
        overlapVolume,
        centroid,
      });
    }
  }

  return clashes
    .sort((left, right) => right.overlapVolume - left.overlapVolume)
    .slice(0, maxClashes);
}

function disciplineLabel(discipline: BimIfcDiscipline): string {
  switch (discipline) {
    case "hvac":
      return "HVAC";
    case "plumbing":
      return "Plumbing";
    case "electrical":
      return "Electrical";
    case "structure":
      return "Structure";
    default:
      return "MEP";
  }
}

export function ifcClashPairsToMepClashItems(
  pairs: IfcAabbClashPair[],
  modelId: string
): MepClashItem[] {
  return pairs.map((pair) => {
    const priority = severityFromOverlap(pair.overlapVolume, pair.elementA, pair.elementB);
    const disciplines = Array.from(
      new Set([disciplineLabel(pair.elementA.discipline), disciplineLabel(pair.elementB.discipline)])
    );

    return {
      id: pair.id,
      type: "ifc_geometry_clash",
      priority,
      disciplines,
      title: bi(
        `IFC clash: ${pair.elementA.ifcType} × ${pair.elementB.ifcType}`,
        `IFC 碰撞：${pair.elementA.ifcType} × ${pair.elementB.ifcType}`
      ),
      description: bi(
        `${pair.elementA.label} (#${pair.elementA.expressId}) intersects ${pair.elementB.label} (#${pair.elementB.expressId}); overlap ~${pair.overlapVolume.toFixed(3)} m³.`,
        `${pair.elementA.label}（#${pair.elementA.expressId}）与 ${pair.elementB.label}（#${pair.elementB.expressId}）发生碰撞，重叠约 ${pair.overlapVolume.toFixed(3)} m³。`
      ),
      location: bi(
        `Model ${modelId} @ (${pair.centroid.x.toFixed(2)}, ${pair.centroid.y.toFixed(2)}, ${pair.centroid.z.toFixed(2)})`,
        `模型 ${modelId} @ (${pair.centroid.x.toFixed(2)}, ${pair.centroid.y.toFixed(2)}, ${pair.centroid.z.toFixed(2)})`
      ),
      remediation: bi(
        "Coordinate routing offsets in BIM; verify clearances in ceiling plenum or shaft.",
        "在 BIM 中协调路由偏移，核实吊顶夹层或管井净距。"
      ),
      modelId,
      elementA: {
        expressId: pair.elementA.expressId,
        ifcType: pair.elementA.ifcType,
        label: pair.elementA.label,
        discipline: pair.elementA.discipline,
      },
      elementB: {
        expressId: pair.elementB.expressId,
        ifcType: pair.elementB.ifcType,
        label: pair.elementB.label,
        discipline: pair.elementB.discipline,
      },
      centroid: pair.centroid,
      overlapVolumeM3: pair.overlapVolume,
    };
  });
}

export function buildIfcMepClashReport(
  pairs: IfcAabbClashPair[],
  modelId: string,
  elementCount: number
): MepClashReport {
  const clashes = ifcClashPairsToMepClashItems(pairs, modelId);
  const criticalCount = clashes.filter(
    (c) => c.priority === "critical" || c.priority === "high"
  ).length;

  return {
    clashCount: clashes.length,
    criticalCount,
    clashes,
    summary:
      clashes.length === 0
        ? bi(
            "No IFC geometry clashes detected in scanned MEP/structure elements.",
            "在扫描的机电/结构构件中未检测到 IFC 几何碰撞。"
          )
        : bi(
            `IFC geometry scan found ${clashes.length} clash(es) (${criticalCount} high/critical) across ${elementCount} elements.`,
            `IFC 几何扫描在 ${elementCount} 个构件中发现 ${clashes.length} 处碰撞（${criticalCount} 处高/严重）。`
          ),
  };
}
