"use client";

import { Suspense } from "react";
import { ProjectSidebar } from "@/components/projects/ProjectSidebar";
import { AIAssistantPanel } from "@/components/ai/AIAssistantPanel";
import { ProjectWorkspace } from "@/components/projects/ProjectWorkspace";
import { StatusBadge } from "@/components/app/StatusBadge";
import { useUIStore } from "@/lib/stores/ui-store";
import type { ProjectWithRelations, StrategyWithMetrics } from "@/types";
import { cn } from "@/lib/utils";

interface ProjectDetailLayoutProps {
  project: ProjectWithRelations;
  section: string;
  strategiesWithMetrics: StrategyWithMetrics[];
}

export function ProjectDetailLayout({
  project,
  section,
  strategiesWithMetrics,
}: ProjectDetailLayoutProps) {
  const aiPanelOpen = useUIStore((s) => s.aiPanelOpen);

  return (
    <div className="flex flex-1 overflow-hidden">
      <Suspense fallback={null}>
        <ProjectSidebar projectId={project.id} />
      </Suspense>
      <main className="flex-1 overflow-y-auto p-4 md:p-6 min-w-0">
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <StatusBadge status={project.status} />
          <span className="text-xs text-muted-foreground">
            {project.buildingType} · {project.constructionYear}
          </span>
        </div>
        <ProjectWorkspace
          project={project}
          section={section}
          strategiesWithMetrics={strategiesWithMetrics}
        />
      </main>
      <div className={cn(
        "shrink-0 transition-all duration-200 overflow-hidden",
        aiPanelOpen ? "w-80" : "w-0"
      )}>
        {aiPanelOpen && (
          <AIAssistantPanel
            projectId={project.id}
            projectName={project.name}
            onClose={() => useUIStore.getState().setAiPanelOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
