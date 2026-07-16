import * as WebIFC from "web-ifc";
import { computeExpressIdBbox3D } from "@/lib/bim/ifc-geometry";
import type { BimBoundingBox3D, BimIfcDiscipline, BimIfcElement, BimPoint3D } from "@/types/bim";

function readIfcText(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "object" && value !== null && "value" in value) {
    const inner = (value as { value?: unknown }).value;
    return typeof inner === "string" ? inner.trim() || null : null;
  }
  return null;
}

function bboxCentroid(bbox: BimBoundingBox3D): BimPoint3D {
  return {
    x: (bbox.min.x + bbox.max.x) / 2,
    y: (bbox.min.y + bbox.max.y) / 2,
    z: (bbox.min.z + bbox.max.z) / 2,
  };
}

type ElementTypeSpec = {
  code: number;
  ifcType: string;
  discipline: BimIfcDiscipline;
};

function resolveElementTypes(): ElementTypeSpec[] {
  const w = WebIFC as Record<string, number>;
  const specs: Array<[string, string, BimIfcDiscipline]> = [
    ["IFCFLOWSEGMENT", "IfcFlowSegment", "hvac"],
    ["IFCFLOWFITTING", "IfcFlowFitting", "hvac"],
    ["IFCFLOWMOVINGDEVICE", "IfcFlowMovingDevice", "hvac"],
    ["IFCFLOWCONTROLLER", "IfcFlowController", "hvac"],
    ["IFCFLOWTERMINAL", "IfcFlowTerminal", "hvac"],
    ["IFCDUCTSEGMENT", "IfcDuctSegment", "hvac"],
    ["IFCDUCTFITTING", "IfcDuctFitting", "hvac"],
    ["IFCPIPESEGMENT", "IfcPipeSegment", "plumbing"],
    ["IFCPIPEFITTING", "IfcPipeFitting", "plumbing"],
    ["IFCCABLECARRIERSEGMENT", "IfcCableCarrierSegment", "electrical"],
    ["IFCCABLECARRIERFITTING", "IfcCableCarrierFitting", "electrical"],
    ["IFCDISTRIBUTIONFLOWELEMENT", "IfcDistributionFlowElement", "other"],
    ["IFCDISTRIBUTIONCHAMBERELEMENT", "IfcDistributionChamberElement", "other"],
    ["IFCBEAM", "IfcBeam", "structure"],
    ["IFCCOLUMN", "IfcColumn", "structure"],
    ["IFCWALL", "IfcWall", "structure"],
    ["IFCWALLSTANDARDCASE", "IfcWallStandardCase", "structure"],
    ["IFCSLAB", "IfcSlab", "structure"],
    ["IFCMEMBER", "IfcMember", "structure"],
  ];

  const seen = new Set<number>();
  const resolved: ElementTypeSpec[] = [];
  for (const [key, ifcType, discipline] of specs) {
    const code = w[key];
    if (typeof code !== "number" || seen.has(code)) continue;
    seen.add(code);
    resolved.push({ code, ifcType, discipline });
  }
  return resolved;
}

export interface ExtractIfcElementsOptions {
  maxElements?: number;
}

export async function extractIfcClashElements(
  ifcApi: WebIFC.IfcAPI,
  modelId: number,
  options: ExtractIfcElementsOptions = {}
): Promise<BimIfcElement[]> {
  const maxElements = options.maxElements ?? 400;
  const elements: BimIfcElement[] = [];
  const seenExpressIds = new Set<number>();

  for (const spec of resolveElementTypes()) {
    if (elements.length >= maxElements) break;

    const ids = ifcApi.GetLineIDsWithType(modelId, spec.code, true);
    for (let i = 0; i < ids.size(); i++) {
      if (elements.length >= maxElements) break;

      const expressId = ids.get(i);
      if (seenExpressIds.has(expressId)) continue;
      seenExpressIds.add(expressId);

      const bboxRaw = computeExpressIdBbox3D(ifcApi, modelId, expressId);
      if (!bboxRaw) continue;

      const sizeX = bboxRaw.max.x - bboxRaw.min.x;
      const sizeY = bboxRaw.max.y - bboxRaw.min.y;
      const sizeZ = bboxRaw.max.z - bboxRaw.min.z;
      if (sizeX < 0.02 && sizeY < 0.02 && sizeZ < 0.02) continue;

      const line = ifcApi.GetLine(modelId, expressId, true);
      const label =
        readIfcText(line?.Name) ??
        readIfcText(line?.ObjectType) ??
        readIfcText(line?.GlobalId) ??
        `${spec.ifcType} ${expressId}`;

      const bbox: BimBoundingBox3D = {
        min: { ...bboxRaw.min },
        max: { ...bboxRaw.max },
      };

      elements.push({
        id: `ifc-${expressId}`,
        expressId,
        ifcType: spec.ifcType,
        label,
        discipline: spec.discipline,
        bbox,
        centroid: bboxCentroid(bbox),
      });
    }
  }

  return elements;
}
