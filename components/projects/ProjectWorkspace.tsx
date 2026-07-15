import type { ProjectSection, ProjectWithRelations, StrategyWithMetrics } from "@/types";
import { ExpertAgentsSection } from "./sections/ExpertAgentsSection";
import { OverviewSection } from "./sections/OverviewSection";
import { BuildingMemorySection } from "./sections/BuildingMemorySection";
import { SurveyIntelligenceSection } from "./sections/SurveyIntelligenceSection";
import { BuildingSection } from "./sections/BuildingSection";
import { DocumentsSection } from "./sections/DocumentsSection";
import { DiagnosisSection } from "./sections/DiagnosisSection";
import { StrategiesSection } from "./sections/StrategiesSection";
import { CostRiskSection } from "./sections/CostRiskSection";
import { IssuesSection } from "./sections/IssuesSection";
import { ReportsSection } from "./sections/ReportsSection";
import { TimelineSection } from "./sections/TimelineSection";
import { BimViewerSection } from "./sections/BimViewerSection";
import { CollaborationSection } from "./sections/CollaborationSection";

interface ProjectWorkspaceProps {
  project: ProjectWithRelations;
  section: string;
  strategiesWithMetrics: StrategyWithMetrics[];
}

const legacySectionMap: Record<string, ProjectSection> = {
  building: "building-memory",
  documents: "survey-intelligence",
  strategies: "strategy-lab",
  timeline: "overview",
};

export function ProjectWorkspace({
  project,
  section,
  strategiesWithMetrics,
}: ProjectWorkspaceProps) {
  const resolved = (legacySectionMap[section] ?? section) as ProjectSection;

  switch (resolved) {
    case "building-memory":
      return <BuildingMemorySection project={project} />;
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
      return <CollaborationSection project={project} initialSummary={project.collaboration} />;
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
