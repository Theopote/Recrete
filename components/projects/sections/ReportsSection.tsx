"use client";

import dynamic from "next/dynamic";
import type { ProjectWithRelations } from "@/types";

const ReportsSectionClient = dynamic(
  () =>
    import("@/components/projects/sections/ReportsSectionClient").then(
      (mod) => mod.ReportsSectionClient
    ),
  {
    ssr: false,
    loading: () => <ReportsSectionSkeleton />,
  }
);

interface ReportsSectionProps {
  project: ProjectWithRelations;
}

export function ReportsSection({ project }: ReportsSectionProps) {
  return <ReportsSectionClient project={project} />;
}

function ReportsSectionSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading reports">
      <div className="h-14 rounded-lg bg-muted/50" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-lg bg-muted/40" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="space-y-2">
          <div className="h-16 rounded-md bg-muted/40" />
        </div>
        <div className="lg:col-span-3 h-96 rounded-lg bg-muted/30" />
      </div>
    </div>
  );
}
