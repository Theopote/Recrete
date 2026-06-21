import { NextResponse } from "next/server";
import { getProjectById } from "@/lib/db/repository";
import { searchSimilarCasesAsync } from "@/lib/ai/knowledge/similar-cases";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const project = await getProjectById(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "5"), 10);

  const result = await searchSimilarCasesAsync(project, { limit, includeWarnings: true });

  return NextResponse.json(result);
}
