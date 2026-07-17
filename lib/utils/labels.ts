import type {
  BudgetLevel,
  DiagnosisCategory,
  DiagnosisStatus,
  DocumentCategory,
  IssueCategory,
  IssuePriority,
  IssueStatus,
  ProjectStatus,
  ReportType,
  RiskLevel,
  SeverityLevel,
  StrategyType,
} from "@/types";
import type { AIInsightType, AIAnalysisType } from "@/types/ai";

type LabelMap<T extends string> = Record<T, string>;

export const projectStatusLabels: LabelMap<ProjectStatus> = {
  draft: "Draft",
  survey: "Survey",
  diagnosis: "Diagnosis",
  strategy: "Strategy",
  design: "Design",
  construction: "Construction",
  completed: "Completed",
  archived: "Archived",
};

export const projectStatusLabelsZh: LabelMap<ProjectStatus> = {
  draft: "草稿",
  survey: "勘察",
  diagnosis: "诊断",
  strategy: "策略",
  design: "设计",
  construction: "施工",
  completed: "已完成",
  archived: "已归档",
};

export const riskLevelLabels: LabelMap<RiskLevel> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const riskLevelLabelsZh: LabelMap<RiskLevel> = {
  low: "低",
  medium: "中",
  high: "高",
  critical: "严重",
};

export const budgetLevelLabels: LabelMap<BudgetLevel> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  premium: "Premium",
};

export const severityLabels: LabelMap<SeverityLevel> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const severityLabelsZh: LabelMap<SeverityLevel> = {
  low: "低",
  medium: "中",
  high: "高",
  critical: "严重",
};

export const diagnosisCategoryLabels: LabelMap<DiagnosisCategory> = {
  architecture: "Architecture",
  structure: "Structure",
  facade: "Facade",
  mep: "MEP",
  fire_safety: "Fire Safety",
  accessibility: "Accessibility",
  energy: "Energy",
  heritage: "Heritage",
  operation: "Operation",
};

export const diagnosisCategoryLabelsZh: LabelMap<DiagnosisCategory> = {
  architecture: "建筑",
  structure: "结构",
  facade: "立面",
  mep: "机电",
  fire_safety: "消防",
  accessibility: "无障碍",
  energy: "节能",
  heritage: "文保",
  operation: "运维",
};

export const diagnosisStatusLabels: LabelMap<DiagnosisStatus> = {
  identified: "Identified",
  under_review: "Under Review",
  confirmed: "Confirmed",
  resolved: "Resolved",
};

export const diagnosisStatusLabelsZh: LabelMap<DiagnosisStatus> = {
  identified: "已识别",
  under_review: "审核中",
  confirmed: "已确认",
  resolved: "已解决",
};

export const documentCategoryLabels: LabelMap<DocumentCategory> = {
  old_drawings: "Old Drawings",
  survey_photos: "Survey Photos",
  structure_documents: "Structure Documents",
  mep_documents: "MEP Documents",
  historical_documents: "Historical Documents",
  cost_documents: "Cost Documents",
  meeting_records: "Meeting Records",
  reports: "Reports",
  regulations: "Regulations & Codes",
  project_brief: "Project Brief",
  scanned_archive: "Scanned Archive",
  others: "Others",
};

export const documentCategoryLabelsZh: LabelMap<DocumentCategory> = {
  old_drawings: "旧图纸",
  survey_photos: "勘察照片",
  structure_documents: "结构资料",
  mep_documents: "机电资料",
  historical_documents: "历史资料",
  cost_documents: "造价资料",
  meeting_records: "会议记录",
  reports: "报告",
  regulations: "法规规范",
  project_brief: "任务书/简报",
  scanned_archive: "扫描档案",
  others: "其他",
};

export const documentProjectPhaseLabels: LabelMap<
  import("@/types").DocumentProjectPhase
> = {
  survey: "Survey",
  diagnosis: "Diagnosis",
  strategy: "Strategy",
  design: "Design",
  construction: "Construction",
  general: "General",
};

export const documentProjectPhaseLabelsZh: LabelMap<
  import("@/types").DocumentProjectPhase
> = {
  survey: "勘察",
  diagnosis: "诊断",
  strategy: "方案",
  design: "设计",
  construction: "施工",
  general: "通用",
};

export const strategyTypeLabels: LabelMap<StrategyType> = {
  light_renewal: "Light Renewal",
  medium_renovation: "Medium Renovation",
  deep_recreation: "Deep Recreation",
  adaptive_reuse: "Adaptive Reuse",
  facade_upgrade: "Facade Upgrade",
  energy_retrofit: "Energy Retrofit",
  safety_upgrade: "Safety Upgrade",
};

export const strategyTypeLabelsZh: LabelMap<StrategyType> = {
  light_renewal: "轻介入更新",
  medium_renovation: "中度改造",
  deep_recreation: "深度再造",
  adaptive_reuse: "适应性再利用",
  facade_upgrade: "立面升级",
  energy_retrofit: "节能改造",
  safety_upgrade: "安全加固",
};

export const issueCategoryLabels: LabelMap<IssueCategory> = {
  crack: "Crack",
  leakage: "Leakage",
  spalling: "Spalling",
  corrosion: "Corrosion",
  structure_exposure: "Structure Exposure",
  mep_conflict: "MEP Conflict",
  facade_damage: "Facade Damage",
  fire_safety: "Fire Safety",
  accessibility: "Accessibility",
  drawing_mismatch: "Drawing Mismatch",
  other: "Other",
};

export const issueCategoryLabelsZh: LabelMap<IssueCategory> = {
  crack: "裂缝",
  leakage: "渗漏",
  spalling: "剥落",
  corrosion: "锈蚀",
  structure_exposure: "结构外露",
  mep_conflict: "机电冲突",
  facade_damage: "立面损伤",
  fire_safety: "消防",
  accessibility: "无障碍",
  drawing_mismatch: "图纸不符",
  other: "其他",
};

export const issuePriorityLabels: LabelMap<IssuePriority> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const issuePriorityLabelsZh: LabelMap<IssuePriority> = {
  low: "低",
  medium: "中",
  high: "高",
  urgent: "紧急",
};

export const issueStatusLabels: LabelMap<IssueStatus> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

export const issueStatusLabelsZh: LabelMap<IssueStatus> = {
  open: "待处理",
  in_progress: "处理中",
  resolved: "已解决",
  closed: "已关闭",
};

export const reportTypeLabels: LabelMap<ReportType> = {
  existing_condition_report: "Existing Condition Report",
  diagnosis_report: "Diagnosis Report",
  renovation_strategy_report: "Renovation Strategy Report",
  owner_presentation: "Owner Presentation",
  government_submission: "Government Submission",
  site_issue_report: "Site Issue Report",
  design_meeting_summary: "Design Meeting Summary",
};

export const reportTypeLabelsZh: LabelMap<ReportType> = {
  existing_condition_report: "现状调研报告",
  diagnosis_report: "建筑诊断报告",
  renovation_strategy_report: "改造策略报告",
  owner_presentation: "业主汇报提纲",
  government_submission: "政府报建草案",
  site_issue_report: "现场问题报告",
  design_meeting_summary: "设计会议纪要",
};

export const insightTypeLabels: Record<AIInsightType, string> = {
  missing_info: "Missing Info",
  risk: "Risk",
  opportunity: "Opportunity",
  design_strategy: "Design Strategy",
  cost_warning: "Cost Warning",
  schedule_warning: "Schedule Warning",
  compliance_warning: "Compliance",
  site_issue: "Site Issue",
  report_suggestion: "Report Suggestion",
  data_conflict: "Data Conflict",
};

export const insightTypeLabelsZh: Record<AIInsightType, string> = {
  missing_info: "缺失信息",
  risk: "风险",
  opportunity: "机会",
  design_strategy: "设计策略",
  cost_warning: "成本预警",
  schedule_warning: "进度预警",
  compliance_warning: "合规",
  site_issue: "现场问题",
  report_suggestion: "报告建议",
  data_conflict: "数据冲突",
};

export const analysisTypeLabels: Record<AIAnalysisType, string> = {
  building_memory_update: "Building Memory Update",
  document_analysis: "Document Analysis",
  missing_info_detection: "Missing Info Detection",
  diagnosis_generation: "Diagnosis Generation",
  strategy_generation: "Strategy Generation",
  cost_risk_estimation: "Cost & Risk Estimation",
  report_generation: "Report Generation",
  copilot_chat: "Copilot Chat",
  conflict_detection: "Conflict Detection",
};

export const analysisTypeLabelsZh: Record<AIAnalysisType, string> = {
  building_memory_update: "建筑记忆更新",
  document_analysis: "文档分析",
  missing_info_detection: "缺失信息检测",
  diagnosis_generation: "诊断生成",
  strategy_generation: "方案生成",
  cost_risk_estimation: "成本与风险估算",
  report_generation: "报告生成",
  copilot_chat: "Copilot 对话",
  conflict_detection: "冲突检测",
};

export function getProjectStatusColor(status: ProjectStatus): string {
  const colors: Record<ProjectStatus, string> = {
    draft: "bg-muted text-muted-foreground",
    survey: "bg-blue-100 text-blue-800",
    diagnosis: "bg-amber-100 text-amber-800",
    strategy: "bg-purple-100 text-purple-800",
    design: "bg-indigo-100 text-indigo-800",
    construction: "bg-orange-100 text-orange-800",
    completed: "bg-green-100 text-green-800",
    archived: "bg-gray-100 text-gray-600",
  };
  return colors[status];
}

export function getRiskColor(risk: RiskLevel): string {
  const colors: Record<RiskLevel, string> = {
    low: "bg-green-100 text-green-800 border-green-200",
    medium: "bg-amber-100 text-amber-800 border-amber-200",
    high: "bg-orange-100 text-orange-800 border-orange-200",
    critical: "bg-red-100 text-red-800 border-red-200",
  };
  return colors[risk];
}

export function getSeverityColor(severity: SeverityLevel): string {
  const colors: Record<SeverityLevel, string> = {
    low: "bg-slate-100 text-slate-700 border-slate-200",
    medium: "bg-amber-100 text-amber-800 border-amber-200",
    high: "bg-orange-100 text-orange-800 border-orange-200",
    critical: "bg-red-100 text-red-800 border-red-200",
  };
  return colors[severity];
}

export function getIssuePriorityColor(priority: IssuePriority): string {
  const colors: Record<IssuePriority, string> = {
    low: "bg-slate-100 text-slate-700",
    medium: "bg-amber-100 text-amber-800",
    high: "bg-orange-100 text-orange-800",
    urgent: "bg-red-100 text-red-800",
  };
  return colors[priority];
}

export function getIssueStatusColor(status: IssueStatus): string {
  const colors: Record<IssueStatus, string> = {
    open: "bg-red-50 text-red-700 border-red-200",
    in_progress: "bg-blue-50 text-blue-700 border-blue-200",
    resolved: "bg-green-50 text-green-700 border-green-200",
    closed: "bg-gray-50 text-gray-600 border-gray-200",
  };
  return colors[status];
}

export function getDiagnosisStatusColor(status: DiagnosisStatus): string {
  const colors: Record<DiagnosisStatus, string> = {
    identified: "bg-slate-100 text-slate-700",
    under_review: "bg-amber-100 text-amber-800",
    confirmed: "bg-orange-100 text-orange-800",
    resolved: "bg-green-100 text-green-800",
  };
  return colors[status];
}

export function getLevelBarColor(level: string): string {
  const colors: Record<string, string> = {
    low: "bg-sage",
    medium: "bg-copper",
    high: "bg-orange-500",
    critical: "bg-destructive",
  };
  return colors[level] ?? "bg-muted";
}
