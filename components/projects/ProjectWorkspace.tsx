"use client";

import dynamic from "next/dynamic";
import type { ProjectSection, ProjectWithRelations, StrategyWithMetrics } from "@/types";
import { OverviewSection } from "./sections/OverviewSection";
import { resolveProjectSection } from "@/lib/projects/section-navigation";

interface ProjectWorkspaceProps {
  project: ProjectWithRelations;
  section: string;
  strategiesWithMetrics: StrategyWithMetrics[];
}

function SectionSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading section">
      <div className="h-10 w-full max-w-xl rounded-md bg-muted/50" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-28 rounded-lg bg-muted/40" />
        ))}
      </div>
      <div className="h-48 rounded-lg bg-muted/40" />
      <div className="h-32 rounded-lg bg-muted/40" />
    </div>
  );
}

const BuildingMemorySection = dynamic(
  () =>
    import("./sections/BuildingMemorySection").then((mod) => mod.BuildingMemorySection),
  { loading: () => <SectionSkeleton /> }
);
const BuildingConditionSection = dynamic(
  () =>
    import("./sections/BuildingConditionSection").then((mod) => mod.BuildingConditionSection),
  { loading: () => <SectionSkeleton /> }
);
const SurveyIntelligenceSection = dynamic(
  () =>
    import("./sections/SurveyIntelligenceSection").then((mod) => mod.SurveyIntelligenceSection),
  { loading: () => <SectionSkeleton /> }
);
const BimViewerSection = dynamic(
  () => import("./sections/BimViewerSection").then((mod) => mod.BimViewerSection),
  { loading: () => <SectionSkeleton /> }
);
const BuildingSection = dynamic(
  () => import("./sections/BuildingSection").then((mod) => mod.BuildingSection),
  { loading: () => <SectionSkeleton /> }
);
const DocumentsSection = dynamic(
  () => import("./sections/DocumentsSection").then((mod) => mod.DocumentsSection),
  { loading: () => <SectionSkeleton /> }
);
const DiagnosisSection = dynamic(
  () => import("./sections/DiagnosisSection").then((mod) => mod.DiagnosisSection),
  { loading: () => <SectionSkeleton /> }
);
const ExpertAgentsSection = dynamic(
  () => import("./sections/ExpertAgentsSection").then((mod) => mod.ExpertAgentsSection),
  { loading: () => <SectionSkeleton /> }
);
const StrategiesSection = dynamic(
  () => import("./sections/StrategiesSection").then((mod) => mod.StrategiesSection),
  { loading: () => <SectionSkeleton /> }
);
const CollaborationSection = dynamic(
  () => import("./sections/CollaborationSection").then((mod) => mod.CollaborationSection),
  { loading: () => <SectionSkeleton /> }
);
const CostRiskSection = dynamic(
  () => import("./sections/CostRiskSection").then((mod) => mod.CostRiskSection),
  { loading: () => <SectionSkeleton /> }
);
const IssuesSection = dynamic(
  () => import("./sections/IssuesSection").then((mod) => mod.IssuesSection),
  { loading: () => <SectionSkeleton /> }
);
const ReportsSection = dynamic(
  () => import("./sections/ReportsSection").then((mod) => mod.ReportsSection),
  { loading: () => <SectionSkeleton /> }
);
const TimelineSection = dynamic(
  () => import("./sections/TimelineSection").then((mod) => mod.TimelineSection),
  { loading: () => <SectionSkeleton /> }
);

export function ProjectWorkspace({
  project,
  section,
  strategiesWithMetrics,
}: ProjectWorkspaceProps) {
  const resolved = resolveProjectSection(section);

  switch (resolved) {
    case "building-memory":
      return <BuildingMemorySection project={project} />;
    case "building-condition":
      return <BuildingConditionSection project={project} />;
    case "survey-intelligence":
      return <SurveyIntelligenceSection project={project} />;
    case "bim-viewer":
      return <BimViewerSection project={project} />;
    case "building":
      return <BuildingSection project={project} />;
    case "documents":
      return <DocumentsSection project={project} />;
    case "diagnosis":
      return <DiagnosisSection project={project} />;
    case "expert-agents":
      return <ExpertAgentsSection project={project} />;
    case "strategy-lab":
    case "strategies":
      return <StrategiesSection project={project} strategiesWithMetrics={strategiesWithMetrics} />;
    case "collaboration":
      return (
        <CollaborationSection project={project} initialSummary={project.collaboration} />
      );
    case "cost-risk":
      return <CostRiskSection project={project} strategiesWithMetrics={strategiesWithMetrics} />;
    case "issues":
      return <IssuesSection project={project} />;
    case "reports":
      return <ReportsSection project={project} />;
    case "timeline":
      return <TimelineSection project={project} />;
    default:
      return <OverviewSection project={project} />;
  }
}

export type { ProjectSection };
