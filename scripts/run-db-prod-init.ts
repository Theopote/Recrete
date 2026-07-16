/**
 * One-time production database init: push schema + seed demo data.
 *
 * Usage:
 *   USE_DATABASE=true DATABASE_URL="postgresql://..." npm run db:prod-init
 *
 * Or set DATABASE_URL in .env and run:
 *   npm run db:prod-init
 */
import { execSync } from "node:child_process";

import "./load-env";

process.env.USE_DATABASE = "true";

if (!process.env.DATABASE_URL?.trim()) {
  console.error("DATABASE_URL is not set.");
  console.error("Set it in .env or pass it inline:");
  console.error('  USE_DATABASE=true DATABASE_URL="postgresql://..." npm run db:prod-init');
  process.exit(1);
}

const maskedUrl = process.env.DATABASE_URL.replace(/:([^:@/]+)@/, ":****@");

const steps: [string, string][] = [
  ["db:push", "Pushing Prisma schema"],
  ["db:seed", "Seeding demo accounts and test data"],
];

console.log("Recrete production database init\n");
console.log(`Target: ${maskedUrl}\n`);

for (const [script, label] of steps) {
  console.log(`→ ${label}...`);
  execSync(`npm run ${script}`, {
    stdio: "inherit",
    env: { ...process.env, USE_DATABASE: "true" },
  });
}

console.log("\nProduction database init completed.");
console.log("Demo logins: lin.wei@recrete.io / test.other@recrete.io (password: recrete2026)");
