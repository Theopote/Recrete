import { NextResponse } from "next/server";
import { getStrategyVersions } from "@/lib/db/repository";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; strategyId: string }> }
) {
  const { strategyId } = await params;
  const versions = await getStrategyVersions(strategyId);
  return NextResponse.json({ versions });
}
