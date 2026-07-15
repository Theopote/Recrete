/**
 * Full DB acceptance pipeline: push schema → seed → verify.
 *
 * Usage: npm run db:acceptance
 */
import { execSync } from "child_process";

process.env.USE_DATABASE = "true";

const steps = [
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
