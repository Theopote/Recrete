import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { TopBar } from "@/components/app/TopBar";
import { SectionHeader } from "@/components/app/SectionHeader";
import { SurveyPageContent } from "@/components/survey/SurveyPageContent";
import { getSessionUser } from "@/lib/auth/session";
import { getAllDocuments, getProjects } from "@/lib/db/repository";

export default async function SurveyPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const documents = await getAllDocuments();
  const projects = await getProjects(user.organizationId);
  const surveyProjects = projects.filter((p) => p.status === "survey" || p.status === "diagnosis");

  return (
    <AppShell>
      <TopBar
        title="Survey"
        titleZh="勘察"
        subtitle="Document archive and field survey overview"
        subtitleZh="文档归档与现场勘察概览"
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl space-y-8">
          <SectionHeader
            title="Survey & Documentation"
            titleZh="勘察与资料"
            description="Cross-project document archive and survey status"
            descriptionZh="跨项目文档归档与勘察状态"
          />
          <SurveyPageContent
            documents={documents}
            surveyProjectCount={surveyProjects.length}
          />
        </div>
      </main>
    </AppShell>
  );
}
