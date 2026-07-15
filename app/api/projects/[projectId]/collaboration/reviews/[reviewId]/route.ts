import { NextResponse } from "next/server";
import { z } from "zod";
import { canApproveReview } from "@/lib/auth/permissions";
import { addReviewComment, updateReviewApproval } from "@/lib/db/collaboration-store";
import { guardOrRespond } from "@/lib/auth/api-guard";
import { requireProjectAccess } from "@/lib/auth/authorize";
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
  const { projectId, reviewId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;
  const { user } = access;

  const denied = await guardOrRespond("POST", "/api/projects/*/collaboration/reviews/*");
  if (denied) return denied;

  const body = await request.json();
  const action = body.action as string;

  if (action === "comment") {
    const parsed = commentSchema.parse(body);
    const comment = await addReviewComment(projectId, reviewId, {
      authorId: user.id,
      authorName: user.name,
      authorRole: user.role as UserRole,
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
    if (!canApproveReview(user.role, parsed.party)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }
    const review = await updateReviewApproval(
      projectId,
      reviewId,
      parsed.party as StakeholderParty,
      parsed.approved,
      user.name,
      parsed.note
    );
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }
    return NextResponse.json(review);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
