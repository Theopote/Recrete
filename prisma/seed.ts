import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  mockUsers,
  mockOrganization,
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

  for (const user of mockUsers) {
    await prisma.user.create({ data: { ...user, passwordHash } });
  }

  await prisma.organization.create({ data: mockOrganization });

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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
