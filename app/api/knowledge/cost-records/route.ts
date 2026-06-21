import { NextResponse } from "next/server";
import { listAllProjectCostRecordsWithProject } from "@/lib/db/repository";

export async function GET() {
  const records = await listAllProjectCostRecordsWithProject();
  return NextResponse.json({ records, count: records.length });
}
