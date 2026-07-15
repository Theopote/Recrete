/**
 * Create an isolated trial organization + lead architect account.
 *
 * Usage:
 *   USE_DATABASE=true DATABASE_URL="..." npx tsx scripts/create-trial-org.ts \
 *     --name "Westline Architects" \
 *     --email "lead@westline.example" \
 *     --password "changeme2026"
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

async function main() {
  const orgName = getArg("--name");
  const email = getArg("--email")?.toLowerCase().trim();
  const password = getArg("--password");
  const orgId = getArg("--id") ?? `org-trial-${Date.now()}`;

  if (!orgName || !email || !password) {
    console.error(
      "Usage: create-trial-org.ts --name \"Firm Name\" --email lead@firm.com --password secret [--id org-trial-x]"
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("Password must be at least 8 characters");
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.error(`Email already registered: ${email}`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const org = await prisma.organization.create({
    data: {
      id: orgId,
      name: orgName,
      description: `Trial organization created ${new Date().toISOString().slice(0, 10)}`,
    },
  });

  const user = await prisma.user.create({
    data: {
      organizationId: org.id,
      name: orgName.split(" ")[0] + " Lead",
      email,
      passwordHash,
      role: "architect",
    },
  });

  console.log("Trial organization created:");
  console.log(`  Org ID:   ${org.id}`);
  console.log(`  Org name: ${org.name}`);
  console.log(`  User ID:  ${user.id}`);
  console.log(`  Email:    ${user.email}`);
  console.log(`  Role:     ${user.role}`);
  console.log("\nShare login URL + credentials with the firm lead.");
  console.log("Data is isolated from org-1 / org-2 demo tenants.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
