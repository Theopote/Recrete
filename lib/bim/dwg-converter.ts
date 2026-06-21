import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { Dwg_File_Type, LibreDwg } from "@mlightcad/libredwg-web";
import { extractCadRooms } from "@/lib/bim/cad-spatial";
import { dwgDatabaseToSvg } from "@/lib/bim/dwg-to-svg";
import type { BimModelFormat, BimModelMetadata } from "@/types/bim";

let libreDwgPromise: Promise<LibreDwg> | null = null;

async function getLibreDwg() {
  if (!libreDwgPromise) {
    const wasmPath = path.join(process.cwd(), "node_modules/@mlightcad/libredwg-web/wasm/");
    libreDwgPromise = LibreDwg.create(wasmPath);
  }
  return libreDwgPromise;
}

export interface CadConversionResult {
  previewUrl: string;
  metadata: BimModelMetadata;
}

function fileTypeForFormat(format: BimModelFormat) {
  return format === "dxf" ? Dwg_File_Type.DXF : Dwg_File_Type.DWG;
}

export async function convertCadBufferToSvg(
  projectId: string,
  modelId: string,
  buffer: Buffer,
  format: Extract<BimModelFormat, "dwg" | "dxf">
): Promise<CadConversionResult> {
  const libredwg = await getLibreDwg();
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  );
  const fileType = fileTypeForFormat(format);
  const handle = libredwg.dwg_read_data(arrayBuffer as ArrayBuffer, fileType);
  if (handle === undefined) {
    throw new Error(`Failed to parse ${format.toUpperCase()} file`);
  }

  const db = libredwg.convert(handle);
  libredwg.dwg_free(handle);

  const { svg, bounds } = dwgDatabaseToSvg(db);
  const rooms = extractCadRooms(db, bounds);
  const totalArea = rooms.reduce((sum, room) => sum + room.area, 0);

  const previewDir = path.join(process.cwd(), "public", "uploads", projectId, "bim-previews");
  await mkdir(previewDir, { recursive: true });
  const previewName = `${modelId}.svg`;
  await writeFile(path.join(previewDir, previewName), svg, "utf8");

  return {
    previewUrl: `/uploads/${projectId}/bim-previews/${previewName}`,
    metadata: {
      entityCount: db.entities?.length ?? 0,
      layerCount: db.tables?.LAYER?.entries?.length ?? 0,
      bounds,
      rooms,
      totalArea: totalArea > 0 ? Math.round(totalArea * 100) / 100 : undefined,
      totalAreaUnit: totalArea > 0 ? "m2" : undefined,
    },
  };
}

/** @deprecated Use convertCadBufferToSvg */
export async function convertDwgBufferToSvg(
  projectId: string,
  modelId: string,
  buffer: Buffer
) {
  const result = await convertCadBufferToSvg(projectId, modelId, buffer, "dwg");
  return {
    previewUrl: result.previewUrl,
    entityCount: result.metadata.entityCount ?? 0,
    layerCount: result.metadata.layerCount ?? 0,
    bounds: result.metadata.bounds ?? { minX: 0, minY: 0, maxX: 0, maxY: 0 },
  };
}
