/**
 * DB acceptance checks for BimModel / DrawingAsset / BackgroundJob dual-mode layers.
 *
 * Usage:
 *   npm run db:up
 *   USE_DATABASE=true npm run db:verify
 */
import { prisma } from "@/lib/db/prisma";
import { addBimModel, getBimModel, listBimModels } from "@/lib/db/bim-models";
import { upsertDrawingAsset, listDrawingAssetsByProject } from "@/lib/db/drawing-assets";
import { enqueueJob, getJob } from "@/lib/jobs/jobs-store";
import { processJobById } from "@/lib/jobs/processor";
import type { BimModel } from "@/types/bim";

const CHECKS: { name: string; run: () => Promise<void> }[] = [];

function check(name: string, fn: () => Promise<void>) {
  CHECKS.push({ name, run: fn });
}

async function getDemoProjectId() {
  const project = await prisma.project.findFirst({ where: { code: "RC-XA-1986-001" } });
  if (!project) throw new Error("Demo project not seeded — run npm run db:seed first");
  return project.id;
}

async function getDemoDocumentId(projectId: string) {
  const doc = await prisma.documentAsset.findFirst({ where: { projectId } });
  if (!doc) throw new Error("No documents found for demo project");
  return doc.id;
}

check("database connection", async () => {
  await prisma.$queryRaw`SELECT 1`;
});

check("BimModel write/read", async () => {
  const projectId = await getDemoProjectId();
  const user = await prisma.user.findFirst();
  if (!user) throw new Error("No users in database");

  const modelId = `verify-bim-${Date.now()}`;
  const model: BimModel = {
    id: modelId,
    projectId,
    name: "verify-test.dwg",
    format: "dwg",
    status: "ready",
    fileUrl: `/uploads/${projectId}/verify-test.dwg`,
    previewUrl: null,
    gltfUrl: null,
    fileSize: 1024,
    mimeType: "application/acad",
    errorMessage: null,
    uploadedById: user.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await addBimModel(model);
  const listed = await listBimModels(projectId);
  if (!listed.some((m) => m.id === modelId)) {
    throw new Error("BimModel not found after insert");
  }
  const fetched = await getBimModel(projectId, modelId);
  if (!fetched || fetched.name !== "verify-test.dwg") {
    throw new Error("BimModel read mismatch");
  }
  await prisma.bimModel.delete({ where: { id: modelId } });
});

check("DrawingAsset upsert/read", async () => {
  const projectId = await getDemoProjectId();
  const documentId = await getDemoDocumentId(projectId);

  const record = await upsertDrawingAsset({
    documentId,
    projectId,
    drawingType: "floor_plan",
    scale: "1:100",
    analysisResult: {
      drawingType: "floor_plan",
      rooms: [{
        id: "room-lobby",
        label: "Lobby",
        area: 120,
        location: { x: 0, y: 0, width: 100, height: 80 },
      }],
      annotations: [],
      dimensions: [],
      structuralElements: [],
      confidence: 0.9,
      extractedText: [],
      summary: "Verify script floor plan",
    },
    knowledgeGraph: {
      projectId,
      documentId,
      documentName: "verify-doc",
      drawingType: "floor_plan",
      nodes: [],
      edges: [],
      updatedAt: new Date().toISOString(),
    },
    openCvResult: null,
    modelName: "verify-script",
    confidence: 0.9,
  });

  const assets = await listDrawingAssetsByProject(projectId);
  if (!assets.some((a) => a.id === record.id)) {
    throw new Error("DrawingAsset not listed after upsert");
  }
  await prisma.drawingAsset.delete({ where: { id: record.id } });
});

check("seeded users present", async () => {
  const count = await prisma.user.count();
  if (count < 5) {
    throw new Error(`Expected at least 5 seeded users, found ${count}`);
  }
});

check("BackgroundJob enqueue/process", async () => {
  const projectId = await getDemoProjectId();
  const documentId = await getDemoDocumentId(projectId);

  const job = await enqueueJob({
    type: "document_ingest",
    projectId,
    payload: {
      projectId,
      organizationId: "org-1",
      documentId,
      createIssues: false,
      refreshBuildingMemory: false,
    },
  });

  const stored = await getJob(job.id);
  if (!stored || stored.status !== "pending") {
    throw new Error("BackgroundJob not persisted as pending");
  }

  const processed = await processJobById(job.id);
  if (!processed || processed.status !== "completed") {
    throw new Error(`BackgroundJob processing failed: ${processed?.error ?? "unknown"}`);
  }

  await prisma.backgroundJob.delete({ where: { id: job.id } });
});

async function main() {
  if (process.env.USE_DATABASE !== "true") {
    console.error("Set USE_DATABASE=true before running db:verify");
    process.exit(1);
  }

  console.log("Recrete DB acceptance verification\n");

  let passed = 0;
  let failed = 0;

  for (const { name, run } of CHECKS) {
    process.stdout.write(`  • ${name} ... `);
    try {
      await run();
      console.log("OK");
      passed += 1;
    } catch (error) {
      console.log("FAIL");
      console.error(`    ${error instanceof Error ? error.message : error}`);
      failed += 1;
    }
  }

  console.log(`\nResult: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
