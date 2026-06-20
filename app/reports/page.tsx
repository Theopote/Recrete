import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { TopBar } from "@/components/app/TopBar";
import { SectionHeader } from "@/components/app/SectionHeader";
import { Card, CardContent } from "@/components/ui/card";
import { getAllReports } from "@/lib/db/repository";
import { reportTypeLabels } from "@/lib/utils/labels";
import { formatDate } from "@/lib/utils";
import { FileText, ExternalLink } from "lucide-react";

export default async function GlobalReportsPage() {
  const reports = await getAllReports();

  return (
    <AppShell>
      <TopBar title="Reports" subtitle={`${reports.length} generated reports`} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <SectionHeader
            title="Project Reports"
            description="All generated reports across renovation projects"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((report) => (
              <Link
                key={report.id}
                href={`/projects/${report.projectId}?section=reports`}
              >
                <Card className="h-full hover:border-copper/40 transition-colors">
                  <CardContent className="p-5 space-y-2">
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-medium leading-tight">{report.title}</h3>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {reportTypeLabels[report.type]}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t">
                      <span className="flex items-center gap-1">
                        {report.projectName} <ExternalLink className="h-2.5 w-2.5" />
                      </span>
                      <span>{formatDate(report.createdAt)}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          {reports.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-12">
              No reports generated yet. Open a project workspace to generate reports.
            </p>
          )}
        </div>
      </main>
    </AppShell>
  );
}
