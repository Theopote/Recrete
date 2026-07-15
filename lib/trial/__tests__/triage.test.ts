import { describe, it, expect } from "vitest";
import { triageTrialFeedback, formatTriageReport } from "@/lib/trial/triage";
import type { TrialFeedbackRecord } from "@/lib/trial/feedback-store";

function row(partial: Partial<TrialFeedbackRecord> & Pick<TrialFeedbackRecord, "notes">): TrialFeedbackRecord {
  return {
    id: "fb-1",
    organizationId: "org-1",
    userId: "u1",
    userName: "Test",
    userEmail: "t@test.io",
    kind: "general",
    isBlocker: false,
    createdAt: new Date("2026-07-01"),
    ...partial,
  };
}

describe("trial feedback triage", () => {
  it("groups blockers and computes AI average", () => {
    const summary = triageTrialFeedback([
      row({ id: "1", kind: "stuck", step: "create_project", isBlocker: true, notes: "无法提交" }),
      row({ id: "2", kind: "ai_quality", aiValueRating: 4, notes: "方案不错" }),
      row({ id: "3", kind: "ai_quality", aiValueRating: 2, notes: "太泛" }),
      row({ id: "4", kind: "unclear_copy", confusingText: "Strategy Lab", notes: "不懂" }),
    ]);

    expect(summary.total).toBe(4);
    expect(summary.blockers).toHaveLength(1);
    expect(summary.avgAiRating).toBe(3);
    expect(summary.byKind.stuck).toBe(1);
    expect(summary.unclearCopy).toHaveLength(1);
  });

  it("formats markdown report with P0 section", () => {
    const summary = triageTrialFeedback([
      row({ kind: "stuck", isBlocker: true, step: "generate_strategies", notes: "按钮无响应" }),
    ]);
    const report = formatTriageReport(summary, { generatedAt: new Date("2026-07-15") });
    expect(report).toContain("P0");
    expect(report).toContain("按钮无响应");
    expect(report).toContain("生成方案");
  });
});
