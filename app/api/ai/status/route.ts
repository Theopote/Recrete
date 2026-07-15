import { NextResponse } from "next/server";
import { getAIStatus } from "@/lib/ai/ai-status";
import { getSessionOrThrow } from "@/lib/auth/authorize";

export async function GET() {
  const session = await getSessionOrThrow();
  if ("error" in session) return session.error;

  const status = await getAIStatus(session.user.organizationId);
  return NextResponse.json(status);
}
