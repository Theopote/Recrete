import type { ProjectSection } from "@/types";
import { pickLocaleText, type AppLocale } from "@/lib/i18n/locale";

export interface NavLabelPair {
  en: string;
  zh: string;
}

export type AppNavHref =
  | "/dashboard"
  | "/projects"
  | "/survey"
  | "/diagnosis"
  | "/strategies"
  | "/issues"
  | "/reports"
  | "/knowledge"
  | "/settings";

export const APP_NAV_LABELS: Record<AppNavHref, NavLabelPair> = {
  "/dashboard": { en: "AI Command Center", zh: "AI 指挥中心" },
  "/projects": { en: "Projects", zh: "项目" },
  "/survey": { en: "Survey Intelligence", zh: "勘察智能" },
  "/diagnosis": { en: "Diagnosis", zh: "诊断" },
  "/strategies": { en: "Strategy Lab", zh: "策略实验室" },
  "/issues": { en: "Issues", zh: "现场问题" },
  "/reports": { en: "Reports", zh: "报告" },
  "/knowledge": { en: "Knowledge Base", zh: "知识库" },
  "/settings": { en: "Settings", zh: "设置" },
};

export const PROJECT_SECTION_LABELS: Record<ProjectSection, NavLabelPair> = {
  overview: { en: "Overview", zh: "概览" },
  "building-memory": { en: "Building Memory", zh: "建筑记忆" },
  "building-condition": { en: "Building Condition", zh: "建筑现状" },
  "survey-intelligence": { en: "Survey Intelligence", zh: "勘察智能" },
  "bim-viewer": { en: "BIM Viewer", zh: "BIM 查看器" },
  diagnosis: { en: "Diagnosis", zh: "诊断" },
  "expert-agents": { en: "Expert Agents", zh: "专家 Agent" },
  "strategy-lab": { en: "Strategy Lab", zh: "策略实验室" },
  collaboration: { en: "Collaboration", zh: "多方协同" },
  "cost-risk": { en: "Cost & Risk", zh: "成本与风险" },
  issues: { en: "Issues", zh: "现场问题" },
  reports: { en: "Reports", zh: "报告" },
  building: { en: "Building Profile", zh: "建筑档案" },
  documents: { en: "Documents", zh: "文档" },
  strategies: { en: "Strategies", zh: "改造方案" },
  timeline: { en: "Timeline", zh: "时间线" },
};

export function navLabel(locale: AppLocale, pair: NavLabelPair): string {
  return pickLocaleText(locale, pair.en, pair.zh);
}
