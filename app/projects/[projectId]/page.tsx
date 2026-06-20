import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/app/AppShell";
import { TopBar } from "@/components/app/TopBar";
import { ProjectSidebar } from "@/components/projects/ProjectSidebar";
import { AIAssistantPanel } from "@/components/ai/AIAssistantPanel";
import { ProjectWorkspace } from "@/components/projects/ProjectWorkspace";
import { getProjectById, getStrategiesWithMetrics } from "@/lib/db/repository";
import { StatusBadge } from "@/components/app/StatusBadge";

interface ProjectDetailPageProps {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ section?: string }>;
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: ProjectDetailPageProps) {
  const { projectId } = await params;
  const { section = "overview" } = await searchParams;

  const project = await getProjectById(projectId);
  if (!project) notFound();

  const strategiesWithMetrics = await getStrategiesWithMetrics(projectId);

  return (
    <AppShell>
      <TopBar
        title={project.name}
        subtitle={`${project.code} · ${project.location}`}
      />
      <div className="flex flex-1 overflow-hidden">
        <Suspense fallback={null}>
          <ProjectSidebar projectId={projectId} />
        </Suspense>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-4 flex items-center gap-2">
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
        <AIAssistantPanel projectId={projectId} projectName={project.name} />
      </div>
    </AppShell>
  );
}
