"use client";

import Link from "next/link";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { MetricCard } from "@/components/app/MetricCard";
import { documentCategoryLabels, documentCategoryLabelsZh } from "@/lib/utils/labels";
import { useLocale } from "@/lib/i18n/use-locale";
import type { DocumentWithProject } from "@/types";
import { FileText, Camera, Layers, ExternalLink } from "lucide-react";

interface SurveyPageContentProps {
  documents: DocumentWithProject[];
  surveyProjectCount: number;
}

export function SurveyPageContent({ documents, surveyProjectCount }: SurveyPageContentProps) {
  const { t, label } = useLocale();

  const categoryCounts = Object.keys(documentCategoryLabels).map((cat) => ({
    category: cat as keyof typeof documentCategoryLabels,
    count: documents.filter((d) => d.category === cat).length,
  }));

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard title={t("Total Documents", "文档总数")} value={documents.length} icon={FileText} />
        <MetricCard
          title={t("Survey Photos", "勘察照片")}
          value={documents.filter((d) => d.category === "survey_photos").length}
          icon={Camera}
        />
        <MetricCard
          title={t("Projects in Survey", "勘察中项目")}
          value={surveyProjectCount}
          icon={Layers}
        />
      </div>

      <div>
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
          {t("Documents by Category", "按分类统计")}
        </h3>
        <div className="flex flex-wrap gap-2">
          {categoryCounts
            .filter((c) => c.count > 0)
            .map(({ category, count }) => (
              <span key={category} className="rounded-full border px-3 py-1 text-xs">
                {label(documentCategoryLabels, documentCategoryLabelsZh, category)} ({count})
              </span>
            ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
          {t("Recent Documents", "最近文档")}
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
    </>
  );
}
