import type {
  CollaborationReview,
  CollaborationSummary,
  ProjectStakeholder,
  ReviewComment,
  StakeholderParty,
} from "@/types/collaboration";
import {
  mockCollaborationReviews,
  mockStakeholders,
} from "@/lib/mock-data/collaboration";
import { generateId } from "@/lib/mock-data";

let stakeholders = [...mockStakeholders];
let reviews = [...mockCollaborationReviews];

export function resetCollaborationStore() {
  stakeholders = [...mockStakeholders];
  reviews = [...mockCollaborationReviews];
}

export async function getCollaborationSummary(
  projectId: string
): Promise<CollaborationSummary> {
  const projectStakeholders = stakeholders.filter((s) => s.projectId === projectId);
  const projectReviews = reviews
    .filter((r) => r.projectId === projectId)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  return {
    stakeholders: projectStakeholders,
    reviews: projectReviews,
    pendingCount: projectReviews.filter((r) => r.status === "pending" || r.status === "in_review").length,
    negotiatingCount: projectReviews.filter((r) => r.status === "negotiating").length,
    approvedCount: projectReviews.filter((r) => r.status === "approved").length,
  };
}

export async function addReviewComment(
  projectId: string,
  reviewId: string,
  comment: Omit<ReviewComment, "id" | "reviewId" | "createdAt">
): Promise<ReviewComment | null> {
  const review = reviews.find((r) => r.id === reviewId && r.projectId === projectId);
  if (!review) return null;

  const newComment: ReviewComment = {
    ...comment,
    id: generateId("cmt"),
    reviewId,
    createdAt: new Date(),
  };

  review.comments.push(newComment);
  review.status = review.status === "pending" ? "in_review" : review.status;
  review.updatedAt = new Date();
  return newComment;
}

export async function updateReviewApproval(
  projectId: string,
  reviewId: string,
  party: StakeholderParty,
  approved: boolean,
  approvedBy: string,
  note?: string
): Promise<CollaborationReview | null> {
  const review = reviews.find((r) => r.id === reviewId && r.projectId === projectId);
  if (!review) return null;

  const approval = review.approvals.find((a) => a.party === party);
  if (!approval) return null;

  approval.approved = approved;
  approval.approvedBy = approvedBy;
  approval.approvedAt = new Date();
  approval.note = note ?? null;

  const allApproved = review.requiredParties.every((p) =>
    review.approvals.find((a) => a.party === p)?.approved
  );
  const anyRejected = review.approvals.some((a) => a.approved === false && a.note?.includes("reject"));

  if (allApproved) {
    review.status = "approved";
  } else if (review.negotiationPoints.some((n) => n.status === "open")) {
    review.status = "negotiating";
  } else if (anyRejected) {
    review.status = "rejected";
  } else {
    review.status = "in_review";
  }

  review.updatedAt = new Date();
  return review;
}

export async function getStakeholders(projectId: string): Promise<ProjectStakeholder[]> {
  return stakeholders.filter((s) => s.projectId === projectId);
}
