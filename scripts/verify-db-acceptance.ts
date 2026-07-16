/**
 * DB acceptance checks for BimModel / DrawingAsset / BackgroundJob dual-mode layers.
 *
 * Usage:
 *   npm run db:up
 *   npm run db:acceptance
 */
import "./load-env";
import { prisma } from "@/lib/db/prisma";
import { addBimModel, getBimModel, listBimModels } from "@/lib/db/bim-models";
import { upsertDrawingAsset, listDrawingAssetsByProject } from "@/lib/db/drawing-assets";
import { enqueueJob, getJob } from "@/lib/jobs/jobs-store";
import { processJobById } from "@/lib/jobs/processor";
import { saveComplianceRun } from "@/lib/db/compliance-store";
import { runComplianceEngine } from "@/lib/ai/compliance";
import type { BimModel } from "@/types/bim";
import type { ProjectWithRelations } from "@/types";

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
  if (count < 6) {
    throw new Error(`Expected at least 6 seeded users, found ${count}`);
  }
});

check("users belong to organizations", async () => {
  const users = await prisma.user.findMany();
  for (const user of users) {
    const org = await prisma.organization.findUnique({ where: { id: user.organizationId } });
    if (!org) {
      throw new Error(`User ${user.email} references missing organization ${user.organizationId}`);
    }
  }
  const org2User = await prisma.user.findUnique({ where: { email: "test.other@recrete.io" } });
  if (!org2User || org2User.organizationId !== "org-2") {
    throw new Error("org-2 test user not seeded correctly");
  }
});

check("two organizations and tenant-scoped projects", async () => {
  const orgCount = await prisma.organization.count();
  if (orgCount < 2) {
    throw new Error(`Expected 2 organizations, found ${orgCount}`);
  }

  const org1Projects = await prisma.project.findMany({ where: { organizationId: "org-1" } });
  const org2Projects = await prisma.project.findMany({ where: { organizationId: "org-2" } });

  if (!org1Projects.some((p) => p.code === "RC-XA-1986-001")) {
    throw new Error("Demo project RC-XA-1986-001 not found under org-1");
  }
  if (!org2Projects.some((p) => p.id === "proj-org2")) {
    throw new Error("proj-org2 not found under org-2");
  }

  const crossLeak = await prisma.project.findFirst({
    where: { id: "proj-demo", organizationId: "org-2" },
  });
  if (crossLeak) {
    throw new Error("proj-demo incorrectly associated with org-2");
  }
});

check("ComplianceCheckRun persistence", async () => {
  const project = await prisma.project.findFirst({ where: { code: "RC-XA-1986-001" } });
  if (!project) throw new Error("Demo project missing");

  const demoProject = {
    ...project,
    building: null,
  } as ProjectWithRelations;

  const report = runComplianceEngine(demoProject, {
    measurements: { stairWidth: 1.3, hasAccessibleEntrance: true },
  });

  const run = await saveComplianceRun({
    projectId: project.id,
    report,
    measurements: { stairWidth: 1.3 },
  });

  const row = await prisma.complianceCheckRun.findUnique({
    where: { id: run.id },
    include: { checks: true },
  });

  if (!row || row.checks.length === 0) {
    throw new Error("ComplianceCheckRun or child checks not persisted");
  }

  await prisma.complianceCheckRecord.deleteMany({ where: { runId: run.id } });
  await prisma.complianceCheckRun.delete({ where: { id: run.id } });
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
