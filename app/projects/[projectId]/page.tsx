import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { TopBar } from "@/components/app/TopBar";
import { ProjectDetailLayout } from "@/components/projects/ProjectDetailLayout";
import { getCollaborationSummary } from "@/lib/db/collaboration-store";
import { getSessionUser } from "@/lib/auth/session";
import {
  getProjectById,
  getProjectOverview,
  getStrategiesWithMetrics,
} from "@/lib/db/repository";
import {
  isOverviewSection,
  resolveProjectSection,
  sectionNeedsCollaboration,
  sectionNeedsStrategyMetrics,
} from "@/lib/projects/section-navigation";
import type { StrategyWithMetrics } from "@/types";
import type { CollaborationSummary } from "@/types/collaboration";

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
  const resolvedSection = resolveProjectSection(section);

  const user = await getSessionUser();
  if (!user) redirect("/login");

  const loadOverview = isOverviewSection(resolvedSection);
  const needsStrategies = sectionNeedsStrategyMetrics(resolvedSection);
  const needsCollaboration = sectionNeedsCollaboration(resolvedSection);

  const [project, strategiesWithMetrics, collaboration] = await Promise.all([
    loadOverview
      ? getProjectOverview(projectId, user.organizationId)
      : getProjectById(projectId, user.organizationId),
    needsStrategies
      ? getStrategiesWithMetrics(projectId)
      : Promise.resolve([] as StrategyWithMetrics[]),
    needsCollaboration
      ? getCollaborationSummary(projectId)
      : Promise.resolve(undefined as CollaborationSummary | undefined),
  ]);
  if (!project) notFound();

  return (
    <AppShell>
      <TopBar
        title={project.name}
        subtitle={`${project.code} · ${project.location}`}
        showAiToggle
      />
      <ProjectDetailLayout
        project={{ ...project, collaboration }}
        section={resolvedSection}
        strategiesWithMetrics={strategiesWithMetrics}
      />
    </AppShell>
  );
}
