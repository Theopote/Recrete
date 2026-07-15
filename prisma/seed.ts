import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  mockUsers,
  mockOrganization,
  mockOrganization2,
  mockProjects,
  mockBuildings,
  mockDocuments,
  mockDiagnosis,
  mockStrategies,
  mockIssues,
  mockReports,
} from "../lib/mock-data";
import { DEMO_PASSWORD } from "../lib/auth/demo-users";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  await prisma.complianceCheckRecord.deleteMany();
  await prisma.complianceCheckRun.deleteMany();
  await prisma.aIConversation.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.backgroundJob.deleteMany();
  await prisma.documentAnalysisTaskRecord.deleteMany();
  await prisma.drawingAsset.deleteMany();
  await prisma.bimModel.deleteMany();
  await prisma.report.deleteMany();
  await prisma.siteIssue.deleteMany();
  await prisma.renovationStrategy.deleteMany();
  await prisma.diagnosisItem.deleteMany();
  await prisma.documentAsset.deleteMany();
  await prisma.building.deleteMany();
  await prisma.project.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  await prisma.organization.create({ data: mockOrganization });
  await prisma.organization.create({ data: mockOrganization2 });

  for (const user of mockUsers) {
    await prisma.user.create({ data: { ...user, passwordHash } });
  }

  for (const project of mockProjects) {
    await prisma.project.create({ data: project });
  }

  for (const building of mockBuildings) {
    await prisma.building.create({ data: building });
  }

  for (const doc of mockDocuments) {
    await prisma.documentAsset.create({ data: doc });
  }

  for (const item of mockDiagnosis) {
    await prisma.diagnosisItem.create({ data: item });
  }

  for (const strategy of mockStrategies) {
    await prisma.renovationStrategy.create({ data: strategy });
  }

  for (const issue of mockIssues) {
    await prisma.siteIssue.create({ data: issue });
  }

  for (const report of mockReports) {
    await prisma.report.create({ data: report });
  }

  console.log("Seed completed.");
  console.log(`Demo password for all users: ${DEMO_PASSWORD}`);
  console.log("Organizations: org-1 (Recrete Studio), org-2 (Northern Heritage Studio)");
  console.log("Cross-tenant test: test.other@recrete.io → org-2 only (proj-org2)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
