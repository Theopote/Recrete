import { openIfcModelFromUrl } from "@/lib/bim/ifc-api-client";
import { extractIfcClashElements } from "@/lib/bim/ifc-mep-elements";
import {
  buildIfcMepClashReport,
  detectIfcAabbClashes,
  type DetectIfcAabbClashOptions,
} from "@/lib/bim/ifc-mep-clash";
import type { MepClashReport } from "@/lib/ai/agents/mep-agent";
import type { BimIfcElement } from "@/types/bim";

export interface RunIfcMepClashResult {
  clashReport: MepClashReport;
  elements: BimIfcElement[];
  elementCount: number;
}

export async function runIfcMepClashFromUrl(
  modelUrl: string,
  modelId: string,
  options: DetectIfcAabbClashOptions & { maxElements?: number } = {}
): Promise<RunIfcMepClashResult> {
  const session = await openIfcModelFromUrl(modelUrl);

  try {
    const elements = await extractIfcClashElements(session.ifcApi, session.modelId, {
      maxElements: options.maxElements,
    });
    const pairs = detectIfcAabbClashes(elements, options);
    const clashReport = buildIfcMepClashReport(pairs, modelId, elements.length);

    return {
      clashReport,
      elements,
      elementCount: elements.length,
    };
  } finally {
    session.close();
  }
}
