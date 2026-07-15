"use client";

import { useState } from "react";
import { DiagnosisCard } from "@/components/diagnosis/DiagnosisCard";
import { DiagnosisFormDialog } from "@/components/diagnosis/DiagnosisFormDialog";
import { SectionHeader } from "@/components/app/SectionHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { AIErrorBanner } from "@/components/ai/AIErrorBanner";
import { parseAIErrorResponse } from "@/lib/ai/client-messages";
import { diagnosisCategoryLabels } from "@/lib/utils/labels";
import type { DiagnosisItem, ProjectWithRelations } from "@/types";
import { Sparkles, Stethoscope, Plus } from "lucide-react";
import { RoleGate } from "@/components/auth/RoleGate";

interface DiagnosisSectionProps {
  project: ProjectWithRelations;
}

export function DiagnosisSection({ project: initialProject }: DiagnosisSectionProps) {
  const [items, setItems] = useState(initialProject.diagnosis ?? []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<{ message: string; retryable: boolean } | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DiagnosisItem | null>(null);

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
      } else {
        const parsed = parseAIErrorResponse(data);
        setAiError(parsed);
      }
    } catch {
      setAiError({ message: "网络异常，请稍后重试。", retryable: true });
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
        description="AI-assisted condition assessment grouped by discipline"
        action={
          <RoleGate action="run_ai_analysis">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={openCreate}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Item
              </Button>
              <Button variant="copper" size="sm" onClick={handleGenerate} disabled={isGenerating}>
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                {isGenerating ? "Generating..." : "Generate AI Diagnosis"}
              </Button>
            </div>
          </RoleGate>
        }
      />

      {aiError && (
        <AIErrorBanner
          message={aiError.message}
          retryable={aiError.retryable}
          onRetry={handleGenerate}
          onDismiss={() => setAiError(null)}
        />
      )}

      <div className="flex flex-wrap gap-2">
        <CategoryPill label="All" count={items.length} active={activeCategory === "all"} onClick={() => setActiveCategory("all")} />
        {Object.entries(diagnosisCategoryLabels).map(([key, label]) => {
          const count = grouped[key]?.length ?? 0;
          if (count === 0) return null;
          return (
            <CategoryPill
              key={key}
              label={label}
              count={count}
              active={activeCategory === key}
              onClick={() => setActiveCategory(key)}
            />
          );
        })}
      </div>

      {filtered.length > 0 ? (
        activeCategory === "all" ? (
          Object.entries(grouped).map(([category, categoryItems]) => (
            <div key={category}>
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                {diagnosisCategoryLabels[category as keyof typeof diagnosisCategoryLabels]} ({categoryItems.length})
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                {categoryItems.map((item) => (
                  <DiagnosisCard key={item.id} item={item} onEdit={openEdit} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((item) => (
              <DiagnosisCard key={item.id} item={item} onEdit={openEdit} />
            ))}
          </div>
        )
      ) : (
        <EmptyState
          icon={Stethoscope}
          title="No diagnosis items"
          description="Add items manually or run AI diagnosis to identify building issues."
          action={{ label: "Generate Diagnosis", onClick: handleGenerate }}
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

function CategoryPill({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
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

function parseDiagnosis(d: DiagnosisItem): DiagnosisItem {
  return {
    ...d,
    createdAt: new Date(d.createdAt),
    updatedAt: new Date(d.updatedAt),
  };
}
