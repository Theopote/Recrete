import { NextResponse } from "next/server";
import { getStrategyVersionById } from "@/lib/db/repository";
import { diffStrategySnapshots } from "@/lib/utils/strategy-diff";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string; strategyId: string }> }
) {
  const { searchParams } = new URL(request.url);
  const fromId = searchParams.get("from");
  const toId = searchParams.get("to");

  if (!fromId || !toId) {
    return NextResponse.json({ error: "from and to version ids required" }, { status: 400 });
  }

  const fromVersion = await getStrategyVersionById(fromId);
  const toVersion = await getStrategyVersionById(toId);

  if (!fromVersion || !toVersion) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  const diffs = diffStrategySnapshots(fromVersion.snapshot, toVersion.snapshot);

  return NextResponse.json({
    from: fromVersion,
    to: toVersion,
    diffs,
  });
}
