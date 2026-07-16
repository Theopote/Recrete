/**
 * Full DB acceptance pipeline: push schema → seed → verify.
 *
 * Usage: npm run db:acceptance
 */
import { execSync } from "node:child_process";

import "./load-env";

process.env.USE_DATABASE = "true";

if (!process.env.DATABASE_URL?.trim()) {
  console.error("DATABASE_URL is not set.");
  console.error("1. Copy .env.example to .env");
  console.error('2. Set USE_DATABASE="true"');
  console.error('3. Set DATABASE_URL="postgresql://postgres:postgres@localhost:5432/recrete?schema=public"');
  console.error("4. Run npm run db:up (requires Docker Desktop)");
  process.exit(1);
}

const steps: [string, string][] = [
  ["db:push", "Pushing Prisma schema"],
  ["db:seed", "Seeding demo data"],
  ["db:verify", "Running acceptance checks"],
];

console.log("Recrete DB acceptance pipeline\n");

for (const [script, label] of steps) {
  console.log(`→ ${label}...`);
  execSync(`npm run ${script}`, {
    stdio: "inherit",
    env: { ...process.env, USE_DATABASE: "true" },
  });
}

console.log("\nDB acceptance pipeline completed successfully.");
