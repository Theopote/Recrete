/**
 * Summarize trial feedback into a prioritized markdown report.
 *
 * Usage:
 *   npm run trial:summary
 *   USE_DATABASE=true DATABASE_URL="..." npm run trial:summary -- --org org-trial-1
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { listTrialFeedback } from "@/lib/trial/feedback-store";
import { triageTrialFeedback, formatTriageReport } from "@/lib/trial/triage";

function parseArgs(argv: string[]) {
  const orgIdx = argv.indexOf("--org");
  return {
    organizationId: orgIdx >= 0 ? argv[orgIdx + 1] : undefined,
    outIdx: argv.indexOf("--out"),
    outPath: argv.includes("--out") ? argv[argv.indexOf("--out") + 1] : undefined,
  };
}

async function main() {
  const { organizationId, outPath } = parseArgs(process.argv.slice(2));

  const feedback = await listTrialFeedback({ organizationId, limit: 500 });
  const summary = triageTrialFeedback(feedback);
  const report = formatTriageReport(summary);

  const defaultOut = path.join(
    process.cwd(),
    "docs",
    `trial-feedback-report-${new Date().toISOString().slice(0, 10)}.md`
  );
  const target = outPath ?? defaultOut;

  writeFileSync(target, report, "utf8");

  console.log(`Trial feedback triage report written to:\n  ${target}\n`);
  console.log(`Total: ${summary.total} | Blockers: ${summary.blockers.length}`);
  if (summary.avgAiRating != null) {
    console.log(`Avg AI rating: ${summary.avgAiRating}/5`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
