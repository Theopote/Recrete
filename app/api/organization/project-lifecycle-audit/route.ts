import { NextResponse } from "next/server";
import { getSessionOrThrow } from "@/lib/auth/authorize";
import { listProjectLifecycleAudits } from "@/lib/db/project-lifecycle-store";

export async function GET(request: Request) {
  const session = await getSessionOrThrow();
  if ("error" in session) return session.error;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);

  const audits = await listProjectLifecycleAudits(session.user.organizationId, limit);
  return NextResponse.json({ audits });
}
