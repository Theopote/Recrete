import { NextResponse } from "next/server";
import { processJobById } from "@/lib/jobs/processor";

function authorize(request: Request) {
  const secret = process.env.JOB_RUNNER_SECRET ?? "recrete-dev-job-secret";
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = await params;
  const job = await processJobById(jobId);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({ job });
}
