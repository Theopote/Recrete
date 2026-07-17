"use client";

import { useState } from "react";
import { DiagnosisCard } from "@/components/diagnosis/DiagnosisCard";
import { DiagnosisFormDialog } from "@/components/diagnosis/DiagnosisFormDialog";
import { SectionHeader } from "@/components/app/SectionHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { AIErrorBanner } from "@/components/ai/AIErrorBanner";
import { parseAIErrorResponse } from "@/lib/ai/client-messages";
import {
  diagnosisCategoryLabels,
  diagnosisCategoryLabelsZh,
} from "@/lib/utils/labels";
import { useLocale } from "@/lib/i18n/use-locale";
import type { DiagnosisCategory, DiagnosisItem, ProjectWithRelations } from "@/types";
import { Sparkles, Stethoscope, Plus, FileText, Link2 } from "lucide-react";
import { RoleGate } from "@/components/auth/RoleGate";
import { EvidenceTrail } from "@/components/diagnosis/EvidenceTrail";
import { AIDisclaimer } from "@/components/ai/AIDisclaimer";
import { resolveEvidenceForDiagnosis } from "@/lib/documents/evidence-tags";

interface DiagnosisSectionProps {
  project: ProjectWithRelations;
}

export function DiagnosisSection({ project: initialProject }: DiagnosisSectionProps) {
  const { t, label } = useLocale();
  const [items, setItems] = useState(initialProject.diagnosis ?? []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRelinking, setIsRelinking] = useState(false);
  const [relinkNotice, setRelinkNotice] = useState<string | null>(null);
  const [aiError, setAiError] = useState<{ message: string; retryable: boolean } | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DiagnosisItem | null>(null);
  const [executiveSummary, setExecutiveSummary] = useState<string | null>(
    findStoredExecutiveSummary(initialProject)
  );

  const categoryLabel = (key: DiagnosisCategory) =>
    label(diagnosisCategoryLabels, diagnosisCategoryLabelsZh, key);

  const projectEvidence = initialProject.sourceEvidence ?? [];
  const documentNames = Object.fromEntries(
    (initialProject.documents ?? []).map((d) => [d.id, d.name])
  );

  const evidenceForItem = (item: DiagnosisItem) =>
    resolveEvidenceForDiagnosis(item, projectEvidence);

  const handleRelinkEvidence = async () => {
    setIsRelinking(true);
    setRelinkNotice(null);
    setAiError(null);
    try {
      const res = await fetch(
        `/api/projects/${initialProject.id}/diagnosis/relink-evidence`,
        { method: "POST" }
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const updated = (data.diagnosisItems ?? []) as DiagnosisItem[];
        if (updated.length > 0) {
          setItems(updated.map(parseDiagnosis));
        }
        setRelinkNotice(
          t(
            `Linked document evidence to ${data.updatedCount ?? 0} diagnosis item(s).`,
            `已为 ${data.updatedCount ?? 0} 条诊断关联文档证据。`
          )
        );
      } else {
        const parsed = parseAIErrorResponse(data);
        setAiError(parsed);
      }
    } catch {
      setAiError({
        message: t("Network error. Please try again.", "网络异常，请稍后重试。"),
        retryable: true,
      });
    } finally {
      setIsRelinking(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setAiError(null);
    try {
      const res = await fetch(`/api/projects/${initialProject.id}/diagnosis/generate`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const newItems = data.diagnosisItems ?? data;
        setItems((prev) => [...newItems.map(parseDiagnosis), ...prev]);
        if (typeof data.executiveSummary === "string" && data.executiveSummary.trim()) {
          setExecutiveSummary(data.executiveSummary);
        }
      } else {
        const parsed = parseAIErrorResponse(data);
        setAiError(parsed);
      }
    } catch {
      setAiError({
        message: t("Network error. Please try again.", "网络异常，请稍后重试。"),
        retryable: true,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaved = (item: DiagnosisItem) => {
    setItems((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists) return prev.map((i) => (i.id === item.id ? item : i));
      return [item, ...prev];
    });
  };

  const openCreate = () => {
    setEditingItem(null);
    setFormOpen(true);
  };

  const openEdit = (item: DiagnosisItem) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const grouped = items.reduce(
    (acc, item) => {
      acc[item.category] = acc[item.category] ?? [];
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, DiagnosisItem[]>
  );

  const filtered =
    activeCategory === "all" ? items : items.filter((i) => i.category === activeCategory);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Building Diagnosis"
        titleZh="建筑诊断"
        description="AI-assisted condition assessment grouped by discipline"
        descriptionZh="AI 辅助的现状评估，按专业分类展示"
        action={
          <RoleGate action="run_ai_analysis">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={openCreate}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                {t("Add Item", "添加条目")}
              </Button>
              {items.length > 0 && projectEvidence.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRelinkEvidence}
                  disabled={isRelinking}
                >
                  <Link2 className="h-3.5 w-3.5 mr-1.5" />
                  {isRelinking
                    ? t("Linking...", "关联中...")
                    : t("Refresh Evidence Links", "刷新证据关联")}
                </Button>
              )}
              <Button variant="copper" size="sm" onClick={handleGenerate} disabled={isGenerating}>
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                {isGenerating
                  ? t("Generating...", "生成中...")
                  : t("Generate AI Diagnosis", "AI 生成诊断")}
              </Button>
            </div>
          </RoleGate>
        }
      />

      <AIDisclaimer />

      {executiveSummary && (
        <div className="rounded-lg border border-copper/30 bg-copper/5 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-copper shrink-0" />
            <h3 className="text-sm font-medium">
              {t("Executive Summary", "执行摘要")}
            </h3>
          </div>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {executiveSummary}
          </p>
        </div>
      )}

      {relinkNotice && (
        <p className="text-xs text-muted-foreground">{relinkNotice}</p>
      )}

      {aiError && (
        <AIErrorBanner
          message={aiError.message}
          retryable={aiError.retryable}
          onRetry={handleGenerate}
          onDismiss={() => setAiError(null)}
        />
      )}

      {projectEvidence.length > 0 && (
        <EvidenceTrail
          evidence={projectEvidence}
          documentNames={documentNames}
          maxItems={6}
        />
      )}

      <div className="flex flex-wrap gap-2">
        <CategoryPill
          label={t("All", "全部")}
          count={items.length}
          active={activeCategory === "all"}
          onClick={() => setActiveCategory("all")}
        />
        {Object.keys(diagnosisCategoryLabels).map((key) => {
          const cat = key as DiagnosisCategory;
          const count = grouped[cat]?.length ?? 0;
          if (count === 0) return null;
          return (
            <CategoryPill
              key={cat}
              label={categoryLabel(cat)}
              count={count}
              active={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
            />
          );
        })}
      </div>

      {filtered.length > 0 ? (
        activeCategory === "all" ? (
          Object.entries(grouped).map(([category, categoryItems]) => (
            <div key={category}>
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                {categoryLabel(category as DiagnosisCategory)} ({categoryItems.length})
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                {categoryItems.map((item) => (
                  <DiagnosisCard
                    key={item.id}
                    item={item}
                    relatedEvidence={evidenceForItem(item)}
                    documentNames={documentNames}
                    onEdit={openEdit}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((item) => (
              <DiagnosisCard
                key={item.id}
                item={item}
                relatedEvidence={evidenceForItem(item)}
                documentNames={documentNames}
                onEdit={openEdit}
              />
            ))}
          </div>
        )
      ) : (
        <EmptyState
          icon={Stethoscope}
          title={t("No diagnosis items", "暂无诊断条目")}
          description={t(
            "Add items manually or run AI diagnosis to identify building issues.",
            "手动添加条目，或运行 AI 诊断识别建筑问题。"
          )}
          action={{
            label: t("Generate Diagnosis", "生成诊断"),
            onClick: handleGenerate,
          }}
        />
      )}

      <DiagnosisFormDialog
        projectId={initialProject.id}
        item={editingItem}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />
    </div>
  );
}

function CategoryPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active ? "bg-primary text-primary-foreground border-primary" : "hover:border-copper/40"
      }`}
    >
      {label} ({count})
    </button>
  );
}

function findStoredExecutiveSummary(project: ProjectWithRelations): string | null {
  const insight = project.insights?.find((i) => i.title === "Diagnosis Executive Summary");
  return insight?.summary?.trim() ? insight.summary : null;
}

function parseDiagnosis(d: DiagnosisItem): DiagnosisItem {
  return {
    ...d,
    createdAt: new Date(d.createdAt),
    updatedAt: new Date(d.updatedAt),
  };
}
