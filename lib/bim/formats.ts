import type { BimModelFormat } from "@/types/bim";

const FORMAT_BY_EXT: Record<string, BimModelFormat> = {
  ifc: "ifc",
  dwg: "dwg",
  dxf: "dxf",
};

const UNSUPPORTED_FORMATS: Record<string, string> = {
  rvt: "Revit (.rvt) files cannot be loaded directly. Export to IFC from Revit (File → Export → IFC).",
  rfa: "Revit family files are not supported. Export the project as IFC.",
  skp: "SketchUp files are not supported in P0. Export to IFC or DWG.",
};

export function detectBimFormat(filename: string): {
  format: BimModelFormat | null;
  unsupportedReason?: string;
} {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (UNSUPPORTED_FORMATS[ext]) {
    return { format: null, unsupportedReason: UNSUPPORTED_FORMATS[ext] };
  }
  const format = FORMAT_BY_EXT[ext];
  return format ? { format } : { format: null, unsupportedReason: `Unsupported format: .${ext}` };
}

export const BIM_ACCEPT = ".ifc,.dwg,.dxf,.IFC,.DWG,.DXF";

/** Bundled demo IFC (That Open `small.ifc`, v2.4.0). Served from /public/samples. */
export const SAMPLE_IFC_URL = "/samples/small.ifc";
