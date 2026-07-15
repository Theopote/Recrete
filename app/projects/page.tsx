import { redirect } from "next/navigation";
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
  const projects = await getProjects(user.organizationId, params);

  const buildingTypes = [...new Set(projects.map((p) => p.buildingType))];
  const targetFunctions = [...new Set(projects.map((p) => p.targetFunction))];

  return (
    <AppShell>
      <TopBar title="Projects" subtitle={`${projects.length} renovation projects`} showNewProject />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <SectionHeader
            title="Renovation Projects"
            description="Manage existing building renovation and adaptive reuse projects"
          />

          <ProjectFilters
            buildingTypes={buildingTypes}
            targetFunctions={targetFunctions}
            currentFilters={params}
          />

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
