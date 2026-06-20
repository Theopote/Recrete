import type { ProjectSection, ProjectWithRelations, StrategyWithMetrics } from "@/types";
import { OverviewSection } from "./sections/OverviewSection";
import { BuildingSection } from "./sections/BuildingSection";
import { DocumentsSection } from "./sections/DocumentsSection";
import { DiagnosisSection } from "./sections/DiagnosisSection";
import { StrategiesSection } from "./sections/StrategiesSection";
import { IssuesSection } from "./sections/IssuesSection";
import { ReportsSection } from "./sections/ReportsSection";
import { TimelineSection } from "./sections/TimelineSection";

interface ProjectWorkspaceProps {
  project: ProjectWithRelations;
  section: string;
  strategiesWithMetrics: StrategyWithMetrics[];
}

export function ProjectWorkspace({
  project,
  section,
  strategiesWithMetrics,
}: ProjectWorkspaceProps) {
  switch (section as ProjectSection) {
    case "building":
      return <BuildingSection project={project} />;
    case "documents":
      return <DocumentsSection project={project} />;
    case "diagnosis":
      return <DiagnosisSection project={project} />;
    case "strategies":
      return <StrategiesSection project={project} strategiesWithMetrics={strategiesWithMetrics} />;
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
