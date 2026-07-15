import { notFound } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { TopBar } from "@/components/app/TopBar";
import { ProjectDetailLayout } from "@/components/projects/ProjectDetailLayout";
import { getCollaborationSummary } from "@/lib/db/collaboration-store";
import { getProjectById, getStrategiesWithMetrics } from "@/lib/db/repository";

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
  const collaboration = await getCollaborationSummary(projectId);

  return (
    <AppShell>
      <TopBar
        title={project.name}
        subtitle={`${project.code} · ${project.location}`}
        showAiToggle
      />
      <ProjectDetailLayout
        project={{ ...project, collaboration }}
        section={section}
        strategiesWithMetrics={strategiesWithMetrics}
      />
    </AppShell>
  );
}
