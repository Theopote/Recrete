import type { ReportType } from "@/types";

export interface ReportTemplateMeta {
  type: ReportType;
  titleEn: string;
  titleZh: string;
  descriptionEn: string;
  descriptionZh: string;
  sections: string[];
  audienceEn?: string;
  audienceZh?: string;
}

export const REPORT_TEMPLATE_CATALOG: ReportTemplateMeta[] = [
  {
    type: "existing_condition_report",
    titleEn: "Existing Condition Report",
    titleZh: "现状调研报告",
    descriptionEn: "Executive summary of building condition, key findings, and recommendations.",
    descriptionZh: "建筑现状综述、主要发现与建议，适合立项与方案前期。",
    sections: ["Executive Summary", "Building Overview", "Key Findings", "Recommendations"],
    audienceEn: "Design team, owner briefing",
    audienceZh: "设计团队、业主简报",
  },
  {
    type: "diagnosis_report",
    titleEn: "Diagnosis Report",
    titleZh: "建筑诊断报告",
    descriptionEn: "Structured diagnosis items grouped by discipline with severity and actions.",
    descriptionZh: "按专业分类的诊断条目、严重等级与处置建议。",
    sections: ["Summary", "Items by Category", "Priority Actions"],
    audienceEn: "Technical consultants",
    audienceZh: "技术顾问、专项工程师",
  },
  {
    type: "renovation_strategy_report",
    titleEn: "Renovation Strategy Report",
    titleZh: "改造策略报告",
    descriptionEn: "Compare renovation strategies with cost, schedule, and risk trade-offs.",
    descriptionZh: "对比各改造策略的成本、工期与风险取舍。",
    sections: ["Strategies Evaluated", "Comparison Matrix", "Recommendation"],
    audienceEn: "Owner decision-making",
    audienceZh: "业主决策、投资评审",
  },
  {
    type: "owner_presentation",
    titleEn: "Owner Presentation",
    titleZh: "业主汇报提纲",
    descriptionEn: "Slide-style outline for stakeholder presentations.",
    descriptionZh: "面向业主的幻灯片式汇报提纲。",
    sections: ["Vision", "Asset Overview", "Challenges", "Next Steps"],
    audienceEn: "Owner / investor meetings",
    audienceZh: "业主、投资方会议",
  },
  {
    type: "government_submission",
    titleEn: "Government Submission",
    titleZh: "政府报建草案",
    descriptionEn: "Urban renewal submission draft with public benefit and compliance notes.",
    descriptionZh: "城市更新报建草案，含公共利益与合规说明。",
    sections: ["Background", "Public Benefit", "Technical Summary", "Compliance"],
    audienceEn: "Planning / heritage authorities",
    audienceZh: "规划、文保主管部门",
  },
  {
    type: "site_issue_report",
    titleEn: "Site Issue Report",
    titleZh: "现场问题报告",
    descriptionEn: "Open and resolved site issues with priority and location.",
    descriptionZh: "现场开放与已关闭问题清单，含优先级与位置。",
    sections: ["Open Issues", "Resolved Issues", "Follow-up"],
    audienceEn: "Site management, contractors",
    audienceZh: "现场管理、施工方",
  },
  {
    type: "design_meeting_summary",
    titleEn: "Design Meeting Summary",
    titleZh: "设计会议纪要",
    descriptionEn: "Discussion topics, decisions, and action items from design reviews.",
    descriptionZh: "设计评审议题、决议与待办事项。",
    sections: ["Discussion", "Decisions", "Action Items"],
    audienceEn: "Project team coordination",
    audienceZh: "项目组协调、周会记录",
  },
];

export function getReportTemplateMeta(type: ReportType): ReportTemplateMeta | undefined {
  return REPORT_TEMPLATE_CATALOG.find((t) => t.type === type);
}
