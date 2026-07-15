import { NextResponse } from "next/server";
import { listStrategyComments, addStrategyComment } from "@/lib/db/strategy-comments";
import { requireProjectAccess } from "@/lib/auth/authorize";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; strategyId: string }> }
) {
  const { projectId, strategyId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;

  const comments = await listStrategyComments(projectId, strategyId);
  return NextResponse.json({ comments });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string; strategyId: string }> }
) {
  const { projectId, strategyId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;

  const body = await request.json();
  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!content) {
    return NextResponse.json({ error: "Comment content required" }, { status: 400 });
  }

  const comment = await addStrategyComment({
    projectId,
    strategyId,
    authorId: access.user.id,
    authorName: access.user.name,
    content,
    riskTag: typeof body.riskTag === "string" ? body.riskTag : null,
    mentionedUserIds: Array.isArray(body.mentionedUserIds)
      ? body.mentionedUserIds.filter((id: unknown) => typeof id === "string")
      : [],
  });

  return NextResponse.json({ comment });
}
