import { NextResponse } from "next/server";
import { drainPendingJobs } from "@/lib/jobs/processor";

function authorize(request: Request) {
  const secret = process.env.JOB_RUNNER_SECRET ?? "recrete-dev-job-secret";
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const limit = typeof body.limit === "number" ? body.limit : 10;
  const processed = await drainPendingJobs(limit);

  return NextResponse.json({ processed });
}
