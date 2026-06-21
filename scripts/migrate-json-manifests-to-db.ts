/**
 * One-time import of data/bim-models/*.json into PostgreSQL.
 * Usage: USE_DATABASE=true npx tsx scripts/migrate-json-manifests-to-db.ts
 */
import { readdir, readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db/prisma";
import { importBimModelsDb } from "@/lib/db/prisma-bim-models";
import type { BimModel } from "@/types/bim";

const DATA_DIR = path.join(process.cwd(), "data", "bim-models");

async function main() {
  if (process.env.USE_DATABASE !== "true") {
    console.error("Set USE_DATABASE=true before running this script.");
    process.exit(1);
  }

  await prisma.$queryRaw`SELECT 1`;

  const files = await readdir(DATA_DIR).catch(() => [] as string[]);
  const jsonFiles = files.filter((f) => f.endsWith(".json"));

  if (jsonFiles.length === 0) {
    console.log("No BIM manifest files found in data/bim-models/");
    return;
  }

  let totalImported = 0;
  for (const file of jsonFiles) {
    const projectId = file.replace(/\.json$/, "");
    const raw = await readFile(path.join(DATA_DIR, file), "utf8");
    const models = JSON.parse(raw) as BimModel[];
    const normalized = models.map((m) => ({
      ...m,
      projectId: m.projectId ?? projectId,
      createdAt: new Date(m.createdAt),
      updatedAt: new Date(m.updatedAt),
    }));
    const imported = await importBimModelsDb(normalized);
    totalImported += imported;
    console.log(`${file}: imported ${imported} / ${normalized.length} models`);
  }

  console.log(`Done. Total new records imported: ${totalImported}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
