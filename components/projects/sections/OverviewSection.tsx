import { BuildingProfileCard } from "@/components/app/BuildingProfileCard";
import { IssueCard } from "@/components/issues/IssueCard";
import { SectionHeader } from "@/components/app/SectionHeader";
import { Card, CardContent } from "@/components/ui/card";
import { AIInsightList } from "@/components/ai/AIInsightList";
import { AIReadinessScore } from "@/components/ai/AIReadinessScore";
import { DataCompletenessScore } from "@/components/ai/DataCompletenessScore";
import { RecommendedActions } from "@/components/ai/RecommendedActions";
import { MissingInformationList } from "@/components/ai/MissingInformationList";
import { AnalysisRunTimeline } from "@/components/ai/AnalysisRunTimeline";
import { BuildingMemoryCard } from "@/components/ai/BuildingMemoryCard";
import type { ProjectWithRelations } from "@/types";
import { Brain } from "lucide-react";
import Link from "next/link";

interface OverviewSectionProps {
  project: ProjectWithRelations;
}

export function OverviewSection({ project }: OverviewSectionProps) {
  const openIssues = project.issues?.filter((i) => i.status === "open" || i.status === "in_progress") ?? [];
  const topInsights = (project.insights ?? [])
    .filter((i) => i.priority === "high" || i.priority === "critical")
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Project Command Overview"
        description={`AI-enriched workspace for ${project.name}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex justify-center p-4">
            <AIReadinessScore score={project.aiReadinessScore} />
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardContent className="p-4">
            <DataCompletenessScore score={project.dataCompletenessScore} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-xs space-y-1">
            <p className="text-muted-foreground">AI Insights</p>
            <p className="text-2xl font-semibold">{project.insights?.length ?? 0}</p>
            <p className="text-muted-foreground">Analysis Runs</p>
            <p className="text-lg font-semibold">{project.analysisRuns?.length ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {project.buildingMemory && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-copper" />
              <h3 className="text-sm font-semibold">Building Memory Snapshot</h3>
            </div>
            <Link
              href={`/projects/${project.id}?section=building-memory`}
              className="text-[10px] font-medium text-copper hover:underline"
            >
              View full memory →
            </Link>
          </div>
          <BuildingMemoryCard memory={project.buildingMemory} />
        </div>
      )}

      <BuildingProfileCard project={project} building={project.building} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <SectionHeader title="Priority AI Insights" />
          <AIInsightList insights={topInsights} compact />
        </div>
        <RecommendedActions tasks={project.tasks ?? []} projectId={project.id} />
      </div>

      <MissingInformationList items={[]} fromMemory={project.buildingMemory} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <SectionHeader title="Recent Issues" />
          {openIssues.length > 0 ? (
            <div className="space-y-3">
              {openIssues.slice(0, 3).map((issue) => (
                <IssueCard key={issue.id} issue={issue} compact />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No open issues</p>
          )}
        </div>
        <div>
          <SectionHeader title="Recent AI Analysis" />
          <AnalysisRunTimeline runs={project.analysisRuns ?? []} limit={4} />
        </div>
      </div>
    </div>
  );
}
