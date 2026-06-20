import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { TopBar } from "@/components/app/TopBar";
import { SectionHeader } from "@/components/app/SectionHeader";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { MetricCard } from "@/components/app/MetricCard";
import { getAllDocuments, getProjects } from "@/lib/db/repository";
import { documentCategoryLabels } from "@/lib/utils/labels";
import { FileText, Camera, Layers, ExternalLink } from "lucide-react";

export default async function SurveyPage() {
  const documents = await getAllDocuments();
  const projects = await getProjects();
  const surveyProjects = projects.filter((p) => p.status === "survey" || p.status === "diagnosis");

  const categoryCounts = Object.keys(documentCategoryLabels).map((cat) => ({
    category: cat,
    count: documents.filter((d) => d.category === cat).length,
  }));

  return (
    <AppShell>
      <TopBar title="Survey" subtitle="Document archive and field survey overview" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl space-y-8">
          <SectionHeader
            title="Survey & Documentation"
            description="Cross-project document archive and survey status"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard title="Total Documents" value={documents.length} icon={FileText} />
            <MetricCard title="Survey Photos" value={documents.filter((d) => d.category === "survey_photos").length} icon={Camera} />
            <MetricCard title="Projects in Survey" value={surveyProjects.length} icon={Layers} />
          </div>

          <div>
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
              Documents by Category
            </h3>
            <div className="flex flex-wrap gap-2">
              {categoryCounts.filter((c) => c.count > 0).map(({ category, count }) => (
                <span key={category} className="rounded-full border px-3 py-1 text-xs">
                  {documentCategoryLabels[category as keyof typeof documentCategoryLabels]} ({count})
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
              Recent Documents
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.slice(0, 8).map((doc) => (
                <div key={doc.id} className="relative">
                  <Link
                    href={`/projects/${doc.projectId}?section=documents`}
                    className="absolute top-3 right-3 z-10 flex items-center gap-1 text-[10px] text-copper hover:underline"
                  >
                    {doc.projectName} <ExternalLink className="h-3 w-3" />
                  </Link>
                  <DocumentCard document={doc} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
