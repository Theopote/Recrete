import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { Dwg_File_Type, LibreDwg } from "@mlightcad/libredwg-web";
import { dwgDatabaseToSvg } from "@/lib/bim/dwg-to-svg";

let libreDwgPromise: Promise<LibreDwg> | null = null;

async function getLibreDwg() {
  if (!libreDwgPromise) {
    const wasmPath = path.join(process.cwd(), "node_modules/@mlightcad/libredwg-web/wasm/");
    libreDwgPromise = LibreDwg.create(wasmPath);
  }
  return libreDwgPromise;
}

export interface DwgConversionResult {
  previewUrl: string;
  entityCount: number;
  layerCount: number;
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}

export async function convertDwgBufferToSvg(
  projectId: string,
  modelId: string,
  buffer: Buffer
): Promise<DwgConversionResult> {
  const libredwg = await getLibreDwg();
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  );
  const dwg = libredwg.dwg_read_data(arrayBuffer as ArrayBuffer, Dwg_File_Type.DWG);
  if (dwg === undefined) {
    throw new Error("Failed to parse DWG file");
  }
  const db = libredwg.convert(dwg);
  libredwg.dwg_free(dwg);

  const { svg, bounds } = dwgDatabaseToSvg(db);
  const previewDir = path.join(process.cwd(), "public", "uploads", projectId, "bim-previews");
  await mkdir(previewDir, { recursive: true });
  const previewName = `${modelId}.svg`;
  await writeFile(path.join(previewDir, previewName), svg, "utf8");

  return {
    previewUrl: `/uploads/${projectId}/bim-previews/${previewName}`,
    entityCount: db.entities?.length ?? 0,
    layerCount: db.tables?.LAYER?.entries?.length ?? 0,
    bounds,
  };
}
