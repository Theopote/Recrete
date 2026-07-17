import type { DocumentAsset, DocumentCategory, DocumentProjectPhase, ProjectStatus } from "@/types";
import { defaultPhaseForProjectStatus } from "@/lib/documents/governance";
import { DOCUMENT_PROJECT_PHASES } from "@/lib/documents/constants";

export interface PhaseCompletenessSlot {
  id: string;
  label: string;
  labelZh: string;
  categories: DocumentCategory[];
  satisfied: boolean;
  analyzed: boolean;
  documentIds: string[];
}

export interface PhaseCompletenessResult {
  phase: DocumentProjectPhase;
  score: number;
  slots: PhaseCompletenessSlot[];
  missingLabels: string[];
  missingLabelsZh: string[];
}

export interface ProjectPhaseCompletenessReport {
  activePhase: DocumentProjectPhase;
  overallScore: number;
  phases: PhaseCompletenessResult[];
}

type SlotDef = {
  id: string;
  label: string;
  labelZh: string;
  categories: DocumentCategory[];
};

const PHASE_SLOT_DEFS: Partial<Record<DocumentProjectPhase, SlotDef[]>> = {
  survey: [
    {
      id: "drawings",
      label: "As-built / historical drawings",
      labelZh: "现状/历史图纸",
      categories: ["old_drawings", "scanned_archive"],
    },
    {
      id: "photos",
      label: "Site survey photos",
      labelZh: "现场勘察照片",
      categories: ["survey_photos"],
    },
    {
      id: "condition",
      label: "Structural / condition reports",
      labelZh: "结构/现状报告",
      categories: ["structure_documents", "reports"],
    },
    {
      id: "brief-reg",
      label: "Regulations or design brief",
      labelZh: "法规或设计任务书",
      categories: ["regulations", "project_brief"],
    },
  ],
  diagnosis: [
    {
      id: "structure",
      label: "Structural assessment",
      labelZh: "结构评估资料",
      categories: ["structure_documents", "reports", "old_drawings"],
    },
    {
      id: "mep",
      label: "MEP records",
      labelZh: "机电资料",
      categories: ["mep_documents"],
    },
    {
      id: "codes",
      label: "Applicable building codes",
      labelZh: "适用规范",
      categories: ["regulations"],
    },
    {
      id: "brief",
      label: "Owner / design brief",
      labelZh: "业主/设计任务书",
      categories: ["project_brief"],
    },
  ],
  strategy: [
    {
      id: "program",
      label: "Program / stakeholder input",
      labelZh: "功能定位/利益相关方输入",
      categories: ["project_brief", "meeting_records"],
    },
    {
      id: "cost",
      label: "Cost benchmarks",
      labelZh: "造价参考",
      categories: ["cost_documents"],
    },
    {
      id: "constraints",
      label: "Code & heritage constraints",
      labelZh: "规范与保护约束",
      categories: ["regulations", "historical_documents"],
    },
  ],
  design: [
    {
      id: "base-drawings",
      label: "Design base drawings",
      labelZh: "设计基础图纸",
      categories: ["old_drawings"],
    },
    {
      id: "mep-design",
      label: "MEP design documents",
      labelZh: "机电设计文件",
      categories: ["mep_documents"],
    },
  ],
  construction: [
    {
      id: "site-records",
      label: "Site records & meeting notes",
      labelZh: "施工记录与会议纪要",
      categories: ["reports", "meeting_records"],
    },
  ],
};

function currentVersionDocs(documents: DocumentAsset[]): DocumentAsset[] {
  return documents.filter((d) => d.isCurrentVersion !== false);
}

function docsForSlot(documents: DocumentAsset[], categories: DocumentCategory[]): DocumentAsset[] {
  return currentVersionDocs(documents).filter((d) => categories.includes(d.category));
}

function computePhaseResult(
  phase: DocumentProjectPhase,
  documents: DocumentAsset[]
): PhaseCompletenessResult {
  const defs = PHASE_SLOT_DEFS[phase] ?? [];
  const slots: PhaseCompletenessSlot[] = defs.map((def) => {
    const matched = docsForSlot(documents, def.categories);
    const analyzed = matched.some((d) => Boolean(d.aiSummary));
    return {
      id: def.id,
      label: def.label,
      labelZh: def.labelZh,
      categories: def.categories,
      satisfied: matched.length > 0,
      analyzed,
      documentIds: matched.map((d) => d.id),
    };
  });

  const satisfiedCount = slots.filter((s) => s.satisfied).length;
  const score = defs.length > 0 ? Math.round((satisfiedCount / defs.length) * 100) : 100;

  return {
    phase,
    score,
    slots,
    missingLabels: slots.filter((s) => !s.satisfied).map((s) => s.label),
    missingLabelsZh: slots.filter((s) => !s.satisfied).map((s) => s.labelZh),
  };
}

export function computePhaseCompleteness(
  phase: DocumentProjectPhase,
  documents: DocumentAsset[]
): PhaseCompletenessResult {
  return computePhaseResult(phase, documents);
}

export function computeProjectPhaseCompleteness(
  documents: DocumentAsset[],
  projectStatus?: ProjectStatus
): ProjectPhaseCompletenessReport {
  const activePhase = projectStatus
    ? defaultPhaseForProjectStatus(projectStatus)
    : "general";

  const phases = DOCUMENT_PROJECT_PHASES.filter((p) => p !== "general").map((phase) =>
    computePhaseResult(phase, documents)
  );

  const active = phases.find((p) => p.phase === activePhase) ?? computePhaseResult(activePhase, documents);
  const analyzedBonus =
    active.slots.filter((s) => s.satisfied && s.analyzed).length /
    Math.max(active.slots.length, 1);

  const overallScore = Math.round(active.score * 0.7 + analyzedBonus * 100 * 0.3);

  return { activePhase, overallScore, phases };
}
