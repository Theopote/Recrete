import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { TopBar } from "@/components/app/TopBar";
import { ProjectCard } from "@/components/app/ProjectCard";
import { SectionHeader } from "@/components/app/SectionHeader";
import { ProjectFilters } from "@/components/projects/ProjectFilters";
import { getSessionUser } from "@/lib/auth/session";
import { getProjects } from "@/lib/db/repository";

interface ProjectsPageProps {
  searchParams: Promise<{
    status?: string;
    riskLevel?: string;
    buildingType?: string;
    targetFunction?: string;
  }>;
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const allProjects = await getProjects(user.organizationId, params);
  const projects =
    params.status && params.status !== "all"
      ? allProjects
      : allProjects.filter((p) => p.status !== "archived" && p.status !== "completed");

  const archivedCount = allProjects.filter((p) => p.status === "archived").length;

  const buildingTypes = [...new Set(allProjects.map((p) => p.buildingType))];
  const targetFunctions = [...new Set(allProjects.map((p) => p.targetFunction))];

  return (
    <AppShell>
      <TopBar
        title="Projects"
        titleZh="项目"
        subtitle={`${projects.length} renovation projects`}
        subtitleZh={`${projects.length} 个改造项目`}
        showNewProject
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <SectionHeader
            title="Renovation Projects"
            titleZh="改造项目"
            description="Manage existing building renovation and adaptive reuse projects"
            descriptionZh="管理既有建筑改造与适应性再利用项目"
          />

          <ProjectFilters
            buildingTypes={buildingTypes}
            targetFunctions={targetFunctions}
            currentFilters={params}
          />

          {archivedCount > 0 && !params.status && (
            <p className="text-xs text-muted-foreground">
              {archivedCount} {archivedCount === 1 ? "archived project" : "archived projects"}{" "}
              hidden.{" "}
              <Link href="/settings" className="text-copper hover:underline">
                View in Settings → Archived Projects
              </Link>
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      </main>
    </AppShell>
  );
}
