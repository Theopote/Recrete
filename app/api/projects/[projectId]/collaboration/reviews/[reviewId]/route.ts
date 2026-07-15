import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { canApproveReview } from "@/lib/auth/permissions";
import { addReviewComment, updateReviewApproval } from "@/lib/db/collaboration-store";
import { guardOrRespond } from "@/lib/auth/api-guard";
import type { UserRole } from "@/types";
import type { StakeholderParty } from "@/types/collaboration";

const commentSchema = z.object({
  content: z.string().min(1).max(2000),
  party: z.enum([
    "owner",
    "design_team",
    "structure_consultant",
    "mep_consultant",
    "heritage_authority",
    "contractor",
    "government",
  ]),
});

const approvalSchema = z.object({
  party: z.enum([
    "owner",
    "design_team",
    "structure_consultant",
    "mep_consultant",
    "heritage_authority",
    "contractor",
    "government",
  ]),
  approved: z.boolean(),
  note: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string; reviewId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const denied = await guardOrRespond("POST", "/api/projects/*/collaboration/reviews/*");
  if (denied) return denied;

  const { projectId, reviewId } = await params;
  const body = await request.json();
  const action = body.action as string;

  if (action === "comment") {
    const parsed = commentSchema.parse(body);
    const comment = await addReviewComment(projectId, reviewId, {
      authorId: session.user.id ?? "unknown",
      authorName: session.user.name ?? "Unknown",
      authorRole: (session.user.role as UserRole) ?? "viewer",
      party: parsed.party as StakeholderParty,
      content: parsed.content,
    });
    if (!comment) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }
    return NextResponse.json(comment);
  }

  if (action === "approve") {
    const parsed = approvalSchema.parse(body);
    const role = (session.user.role as UserRole) ?? "viewer";
    if (!canApproveReview(role, parsed.party)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }
    const review = await updateReviewApproval(
      projectId,
      reviewId,
      parsed.party as StakeholderParty,
      parsed.approved,
      session.user.name ?? "Unknown",
      parsed.note
    );
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }
    return NextResponse.json(review);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
