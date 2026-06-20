"use client";

import { useState } from "react";
import { DiagnosisCard } from "@/components/diagnosis/DiagnosisCard";
import { SectionHeader } from "@/components/app/SectionHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { diagnosisCategoryLabels } from "@/lib/utils/labels";
import type { DiagnosisItem, ProjectWithRelations } from "@/types";
import { Sparkles, Stethoscope } from "lucide-react";

interface DiagnosisSectionProps {
  project: ProjectWithRelations;
}

export function DiagnosisSection({ project: initialProject }: DiagnosisSectionProps) {
  const [items, setItems] = useState(initialProject.diagnosis ?? []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/projects/${initialProject.id}/diagnosis/generate`, {
        method: "POST",
      });
      if (res.ok) {
        const newItems = await res.json();
        setItems((prev) => [...newItems, ...prev]);
      }
    } finally {
      setIsGenerating(false);
    }
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
          <Button variant="copper" size="sm" onClick={handleGenerate} disabled={isGenerating}>
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            {isGenerating ? "Generating..." : "Generate AI Diagnosis"}
          </Button>
        }
      />

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
                  <DiagnosisCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((item) => (
              <DiagnosisCard key={item.id} item={item} />
            ))}
          </div>
        )
      ) : (
        <EmptyState
          icon={Stethoscope}
          title="No diagnosis items"
          description="Run AI diagnosis to identify building issues across architecture, structure, MEP, and more."
          action={{ label: "Generate Diagnosis", onClick: handleGenerate }}
        />
      )}
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
