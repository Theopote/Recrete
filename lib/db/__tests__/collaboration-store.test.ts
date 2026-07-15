import { describe, it, expect, beforeEach } from "vitest";
import {
  getCollaborationSummary,
  addReviewComment,
  updateReviewApproval,
  resetCollaborationStore,
} from "@/lib/db/collaboration-store";

describe("collaboration-store", () => {
  beforeEach(() => {
    resetCollaborationStore();
  });

  it("returns demo project stakeholders and reviews", async () => {
    const summary = await getCollaborationSummary("proj-demo");
    expect(summary.stakeholders.length).toBeGreaterThanOrEqual(5);
    expect(summary.reviews.length).toBeGreaterThanOrEqual(3);
    expect(summary.negotiatingCount).toBeGreaterThanOrEqual(1);
  });

  it("adds a comment and moves review to in_review", async () => {
    const comment = await addReviewComment("proj-demo", "rev-3", {
      authorId: "user-1",
      authorName: "Lin Wei",
      authorRole: "architect",
      party: "design_team",
      content: "Ready for owner review.",
    });
    expect(comment).not.toBeNull();
    const summary = await getCollaborationSummary("proj-demo");
    const review = summary.reviews.find((r) => r.id === "rev-3");
    expect(review?.status).toBe("in_review");
    expect(review?.comments.some((c) => c.content.includes("Ready for owner"))).toBe(true);
  });

  it("updates approval status for a party", async () => {
    const review = await updateReviewApproval(
      "proj-demo",
      "rev-1",
      "owner",
      true,
      "Wang Fang",
      "Approved after space adjustment"
    );
    expect(review).not.toBeNull();
    const ownerApproval = review!.approvals.find((a) => a.party === "owner");
    expect(ownerApproval?.approved).toBe(true);
    expect(ownerApproval?.approvedBy).toBe("Wang Fang");
  });
});
