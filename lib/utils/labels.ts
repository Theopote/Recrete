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

export const riskLevelLabels: LabelMap<RiskLevel> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
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

export const diagnosisStatusLabels: LabelMap<DiagnosisStatus> = {
  identified: "Identified",
  under_review: "Under Review",
  confirmed: "Confirmed",
  resolved: "Resolved",
};

export const documentCategoryLabels: LabelMap<DocumentCategory> = {
  old_drawings: "Old Drawings",
  survey_photos: "Survey Photos",
  structure_documents: "Structure Documents",
  mep_documents: "MEP Documents",
  historical_documents: "Historical Documents",
  cost_documents: "Cost Documents",
  reports: "Reports",
  others: "Others",
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

export const issuePriorityLabels: LabelMap<IssuePriority> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const issueStatusLabels: LabelMap<IssueStatus> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

export const reportTypeLabels: LabelMap<ReportType> = {
  existing_condition_report: "Existing Condition Report",
  diagnosis_report: "Diagnosis Report",
  renovation_strategy_report: "Renovation Strategy Report",
  owner_presentation: "Owner Presentation",
  government_submission: "Government Submission",
  site_issue_report: "Site Issue Report",
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
