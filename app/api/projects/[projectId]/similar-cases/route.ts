import { NextResponse } from "next/server";
import { requireProjectAccess } from "@/lib/auth/authorize";
import { searchSimilarCasesAsync } from "@/lib/ai/knowledge/similar-cases";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "5"), 10);

  const result = await searchSimilarCasesAsync(access.project, { limit, includeWarnings: true });

  return NextResponse.json(result);
}
