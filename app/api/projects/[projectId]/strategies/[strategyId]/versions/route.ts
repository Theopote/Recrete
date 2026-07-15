import { NextResponse } from "next/server";
import { getStrategyVersions } from "@/lib/db/repository";
import { requireProjectAccess } from "@/lib/auth/authorize";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; strategyId: string }> }
) {
  const { projectId, strategyId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;

  const versions = await getStrategyVersions(strategyId);
  return NextResponse.json({ versions });
}
