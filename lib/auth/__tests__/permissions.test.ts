import { describe, it, expect } from "vitest";
import { canPerformAction, canApproveReview, getRolePermissions } from "@/lib/auth/permissions";

describe("permissions", () => {
  it("grants architects strategy creation and collaboration management", () => {
    expect(canPerformAction("architect", "create_strategy")).toBe(true);
    expect(canPerformAction("architect", "manage_collaboration")).toBe(true);
    expect(canPerformAction("architect", "manage_members")).toBe(false);
  });

  it("restricts owners to view, approve, and collaboration", () => {
    expect(getRolePermissions("owner")).toEqual(["view", "approve_strategy", "manage_collaboration"]);
    expect(canPerformAction("owner", "create_strategy")).toBe(false);
  });

  it("allows party-specific review approval", () => {
    expect(canApproveReview("owner", "owner")).toBe(true);
    expect(canApproveReview("architect", "design_team")).toBe(true);
    expect(canApproveReview("viewer", "owner")).toBe(false);
  });
});
