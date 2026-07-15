/**
 * Pre-trial deployment checks (Month 5).
 *
 * Usage: npm run smoke:trial-prep
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const CHECKS: { name: string; run: () => void | Promise<void> }[] = [];

function check(name: string, fn: () => void | Promise<void>) {
  CHECKS.push({ name, run: fn });
}

function requireEnv(name: string, options?: { warnOnly?: boolean }) {
  const value = process.env[name]?.trim();
  if (!value) {
    const msg = `Missing env: ${name}`;
    if (options?.warnOnly) {
      console.warn(`    [warn] ${msg}`);
      return;
    }
    throw new Error(msg);
  }
}

check("USE_DATABASE should be true for trial", () => {
  if (process.env.USE_DATABASE !== "true") {
    throw new Error("Set USE_DATABASE=true before inviting a firm");
  }
});

check("DATABASE_URL configured", () => {
  requireEnv("DATABASE_URL");
});

check("NEXTAUTH_SECRET configured", () => {
  requireEnv("NEXTAUTH_SECRET");
  if (process.env.NEXTAUTH_SECRET === "recrete-dev-secret-change-in-production") {
    throw new Error("NEXTAUTH_SECRET still uses dev default — rotate for production");
  }
});

check("NEXTAUTH_URL configured", () => {
  requireEnv("NEXTAUTH_URL");
  if (process.env.NEXTAUTH_URL?.includes("localhost")) {
    throw new Error("NEXTAUTH_URL should be the public trial URL, not localhost");
  }
});

check("JOB_RUNNER_SECRET configured", () => {
  requireEnv("JOB_RUNNER_SECRET");
});

check("OPENAI_API_KEY for real AI (recommended)", () => {
  requireEnv("OPENAI_API_KEY", { warnOnly: true });
});

check("STORAGE_PROVIDER for uploads on Vercel", () => {
  const provider = process.env.STORAGE_PROVIDER ?? "local";
  if (provider === "local" && process.env.VERCEL === "1") {
    throw new Error(
      "STORAGE_PROVIDER=local on Vercel — uploads will not persist. Set STORAGE_PROVIDER=s3 and S3_* vars."
    );
  }
  if (provider === "s3") {
    requireEnv("S3_BUCKET");
    requireEnv("S3_ACCESS_KEY_ID");
    requireEnv("S3_SECRET_ACCESS_KEY");
  }
});

check("trial feedback widget enabled", () => {
  if (process.env.NEXT_PUBLIC_TRIAL_FEEDBACK === "false") {
    throw new Error("NEXT_PUBLIC_TRIAL_FEEDBACK=false — enable feedback collection during pilot");
  }
});

check("core journey smoke passes", () => {
  const result = spawnSync("npm", ["run", "smoke:core"], {
    cwd: process.cwd(),
    shell: true,
    stdio: "inherit",
    env: { ...process.env, USE_DATABASE: "false" },
  });
  if (result.status !== 0) {
    throw new Error("smoke:core failed");
  }
});

check("prisma schema present", () => {
  const schema = path.join(process.cwd(), "prisma", "schema.prisma");
  if (!existsSync(schema)) {
    throw new Error("prisma/schema.prisma not found");
  }
});

async function main() {
  console.log("Recrete trial prep checks\n");
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
  if (failed > 0) {
    console.log("\nFix blockers above before inviting the pilot firm.");
    console.log("See docs/trial-pilot-guide.md and docs/trial-observer-playbook.md");
    process.exit(1);
  }
  console.log("\nReady for pilot onboarding. Share docs/trial-pilot-guide.md with the firm.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
