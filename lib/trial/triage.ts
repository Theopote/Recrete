import type { TrialFeedbackRecord } from "@/lib/trial/feedback-store";

export interface TrialTriageSummary {
  total: number;
  blockers: TrialFeedbackRecord[];
  byKind: Record<string, number>;
  byStep: Record<string, number>;
  aiRatings: number[];
  avgAiRating: number | null;
  unclearCopy: TrialFeedbackRecord[];
  stuck: TrialFeedbackRecord[];
}

export function triageTrialFeedback(feedback: TrialFeedbackRecord[]): TrialTriageSummary {
  const byKind: Record<string, number> = {};
  const byStep: Record<string, number> = {};
  const aiRatings: number[] = [];
  const blockers: TrialFeedbackRecord[] = [];
  const unclearCopy: TrialFeedbackRecord[] = [];
  const stuck: TrialFeedbackRecord[] = [];

  for (const row of feedback) {
    byKind[row.kind] = (byKind[row.kind] ?? 0) + 1;
    if (row.step) {
      byStep[row.step] = (byStep[row.step] ?? 0) + 1;
    }
    if (row.isBlocker) blockers.push(row);
    if (row.kind === "unclear_copy") unclearCopy.push(row);
    if (row.kind === "stuck") stuck.push(row);
    if (row.aiValueRating != null) aiRatings.push(row.aiValueRating);
  }

  const avgAiRating =
    aiRatings.length > 0
      ? Math.round((aiRatings.reduce((a, b) => a + b, 0) / aiRatings.length) * 10) / 10
      : null;

  return {
    total: feedback.length,
    blockers,
    byKind,
    byStep,
    aiRatings,
    avgAiRating,
    unclearCopy,
    stuck,
  };
}

const KIND_LABELS: Record<string, string> = {
  stuck: "卡在某一步",
  unclear_copy: "文案看不懂",
  ai_quality: "AI 方案价值",
  general: "其他",
};

const STEP_LABELS: Record<string, string> = {
  login: "登录",
  create_project: "建项目",
  upload_document: "上传资料",
  document_analysis: "资料分析",
  diagnosis: "诊断",
  generate_strategies: "生成方案",
  strategy_review: "方案评审",
  reports: "报告",
  other: "其他",
};

export function formatTriageReport(
  summary: TrialTriageSummary,
  options?: { generatedAt?: Date }
): string {
  const at = (options?.generatedAt ?? new Date()).toISOString();
  const lines: string[] = [
    "# 试用反馈分流报告",
    "",
    `生成时间：${at}`,
    `反馈总数：**${summary.total}**`,
    "",
  ];

  if (summary.blockers.length > 0) {
    lines.push("## P0 · 阻塞性问题（立即处理）", "");
    for (const row of summary.blockers) {
      lines.push(
        `- **${row.userName}** · ${row.step ? STEP_LABELS[row.step] ?? row.step : "未标注步骤"}`,
        `  - ${row.notes}`,
        row.pagePath ? `  - 页面：\`${row.pagePath}\`` : "",
        ""
      );
    }
  } else {
    lines.push("## P0 · 阻塞性问题", "", "_暂无标记为阻塞的反馈_", "", "");
  }

  lines.push("## 分布统计", "");
  lines.push("### 按类型", "");
  for (const [kind, count] of Object.entries(summary.byKind).sort((a, b) => b[1] - a[1])) {
    lines.push(`- ${KIND_LABELS[kind] ?? kind}：${count}`);
  }
  lines.push("");

  if (Object.keys(summary.byStep).length > 0) {
    lines.push("### 按步骤", "");
    for (const [step, count] of Object.entries(summary.byStep).sort((a, b) => b[1] - a[1])) {
      lines.push(`- ${STEP_LABELS[step] ?? step}：${count}`);
    }
    lines.push("");
  }

  if (summary.avgAiRating != null) {
    lines.push(
      `### AI 方案评分`,
      `- 平均分：**${summary.avgAiRating}** / 5（${summary.aiRatings.length} 条评分）`,
      ""
    );
  }

  if (summary.unclearCopy.length > 0) {
    lines.push("## P2 · 文案问题（候选）", "");
    for (const row of summary.unclearCopy.slice(0, 10)) {
      lines.push(
        `- ${row.confusingText ? `「${row.confusingText}」` : row.notes}`,
        row.pagePath ? `  - \`${row.pagePath}\`` : "",
        ""
      );
    }
  }

  if (summary.stuck.length > 0) {
    lines.push("## P1 · 卡点（候选）", "");
    for (const row of summary.stuck.filter((r) => !r.isBlocker).slice(0, 10)) {
      lines.push(
        `- **${STEP_LABELS[row.step ?? "other"] ?? row.step}**：${row.notes}`,
        row.pagePath ? `  - \`${row.pagePath}\`` : "",
        ""
      );
    }
  }

  lines.push(
    "## 下一步",
    "",
    "1. 将 P0 项录入 `docs/trial-fix-backlog.md` 并分配修复批次",
    "2. 与观察手册中的会话记录交叉核对",
    "3. 修完一批后跑 `npm run smoke:core` + `npm run smoke:trial-prep`",
    ""
  );

  return lines.filter((line) => line !== undefined).join("\n");
}
