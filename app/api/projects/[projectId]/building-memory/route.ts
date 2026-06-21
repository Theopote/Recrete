import { NextResponse } from "next/server";
import { updateBuildingMemory } from "@/lib/db/repository";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const memory = await updateBuildingMemory(projectId);
  if (!memory) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  return NextResponse.json({ memory });
}
