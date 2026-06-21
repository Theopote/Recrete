import { cpSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const root = process.cwd();
const webIfcSrc = join(root, "node_modules/web-ifc");
const webIfcDest = join(root, "public/wasm/web-ifc");

if (!existsSync(webIfcSrc)) {
  console.warn("[setup-bim-wasm] web-ifc not installed — skip WASM copy");
  process.exit(0);
}

mkdirSync(webIfcDest, { recursive: true });

for (const file of ["web-ifc.wasm", "web-ifc-mt.wasm"]) {
  const src = join(webIfcSrc, file);
  if (existsSync(src)) {
    cpSync(src, join(webIfcDest, file));
    console.log(`[setup-bim-wasm] copied ${file}`);
  }
}

console.log("[setup-bim-wasm] done");
