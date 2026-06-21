"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DocumentsSection } from "./DocumentsSection";
import { SectionHeader } from "@/components/app/SectionHeader";
import { DataCompletenessScore } from "@/components/ai/DataCompletenessScore";
import { MissingInformationList } from "@/components/ai/MissingInformationList";
import { RecommendedActions } from "@/components/ai/RecommendedActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { missingDocumentCategories } from "@/lib/mock-data/ai-native";
import type { ProjectWithRelations } from "@/types";
import { Sparkles, Loader2, FileSearch } from "lucide-react";
import { ConfidenceBadge } from "@/components/ai/ConfidenceBadge";

interface SurveyIntelligenceSectionProps {
  project: ProjectWithRelations;
}

export function SurveyIntelligenceSection({ project }: SurveyIntelligenceSectionProps) {
  const router = useRouter();
  const [analyzing, setAnalyzing] = useState(false);
  const documents = project.documents ?? [];

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      await fetch(`/api/projects/${project.id}/survey/analyze`, { method: "POST" });
      router.refresh();
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Survey Intelligence"
        description="AI-powered document analysis, missing information detection, and survey task recommendations"
        action={
          <Button variant="copper" size="sm" onClick={handleAnalyze} disabled={analyzing}>
            {analyzing ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            )}
            Analyze Documents
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <DataCompletenessScore score={project.dataCompletenessScore} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Documents on file</p>
            <p className="text-2xl font-semibold tabular-nums">{documents.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">AI-analyzed</p>
            <p className="text-2xl font-semibold tabular-nums">
              {documents.filter((d) => d.aiSummary).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {documents.some((d) => d.aiSummary) && (
        <div>
          <SectionHeader title="AI Document Summaries" icon={FileSearch} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {documents
              .filter((d) => d.aiSummary)
              .map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-xs font-semibold">{doc.name}</p>
                      <ConfidenceBadge confidence={0.85} />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{doc.aiSummary}</p>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      <MissingInformationList items={missingDocumentCategories} fromMemory={project.buildingMemory} />

      <RecommendedActions tasks={(project.tasks ?? []).filter((t) => t.category === "survey")} />

      <DocumentsSection project={project} />
    </div>
  );
}
