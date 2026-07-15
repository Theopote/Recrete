import { describe, it, expect, beforeEach } from "vitest";
import {
  submitTrialFeedback,
  listTrialFeedback,
  clearTrialFeedbackMemory,
} from "@/lib/trial/feedback-store";

describe("trial feedback store", () => {
  beforeEach(() => {
    process.env.USE_DATABASE = "false";
    clearTrialFeedbackMemory();
  });

  it("submits and lists feedback in memory mode", async () => {
    const user = {
      id: "user-1",
      organizationId: "org-1",
      name: "Lin Wei",
      email: "lin.wei@recrete.io",
    };

    await submitTrialFeedback(user, {
      kind: "stuck",
      step: "create_project",
      notes: "提交后没有跳转",
      isBlocker: true,
      pagePath: "/projects/new",
    });

    const rows = await listTrialFeedback({ organizationId: "org-1" });
    expect(rows).toHaveLength(1);
    expect(rows[0].kind).toBe("stuck");
    expect(rows[0].isBlocker).toBe(true);
    expect(rows[0].notes).toContain("跳转");
  });

  it("isolates feedback by organization", async () => {
    await submitTrialFeedback(
      { id: "u1", organizationId: "org-1", name: "A", email: "a@test.io" },
      { kind: "general", notes: "org1 note" }
    );
    await submitTrialFeedback(
      { id: "u2", organizationId: "org-2", name: "B", email: "b@test.io" },
      { kind: "general", notes: "org2 note" }
    );

    const org1 = await listTrialFeedback({ organizationId: "org-1" });
    expect(org1).toHaveLength(1);
    expect(org1[0].notes).toBe("org1 note");
  });
});
