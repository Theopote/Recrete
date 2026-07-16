"use client";

import { Card, CardContent } from "@/components/ui/card";
import { reportTypeLabels, reportTypeLabelsZh } from "@/lib/utils/labels";
import { useLocale } from "@/lib/i18n/use-locale";
import { formatDate } from "@/lib/utils";
import { FileText, ExternalLink } from "lucide-react";
import type { ReportType } from "@/types";

interface GlobalReportItem {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  type: ReportType;
  createdAt: Date;
}

interface GlobalReportsPageContentProps {
  reports: GlobalReportItem[];
}

export function GlobalReportsPageContent({ reports }: GlobalReportsPageContentProps) {
  const { t, label } = useLocale();

  if (reports.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">
        {t(
          "No reports generated yet. Open a project workspace to generate reports.",
          "暂无报告。请进入项目工作区生成报告。"
        )}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {reports.map((report) => (
        <a
          key={report.id}
          href={`/projects/${report.projectId}?section=reports`}
          className="block h-full no-underline text-inherit"
        >
          <Card className="h-full hover:border-copper/40 transition-colors">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium leading-tight">{report.title}</h3>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {label(reportTypeLabels, reportTypeLabelsZh, report.type)}
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
        </a>
      ))}
    </div>
  );
}
