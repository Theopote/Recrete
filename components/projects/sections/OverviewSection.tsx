import { BuildingProfileCard } from "@/components/app/BuildingProfileCard";
import { IssueCard } from "@/components/issues/IssueCard";
import { SectionHeader } from "@/components/app/SectionHeader";
import { Card, CardContent } from "@/components/ui/card";
import { RiskBadge } from "@/components/app/RiskBadge";
import { StatusBadge } from "@/components/app/StatusBadge";
import type { ProjectWithRelations } from "@/types";
import { CheckCircle2, FileWarning } from "lucide-react";

interface OverviewSectionProps {
  project: ProjectWithRelations;
}

export function OverviewSection({ project }: OverviewSectionProps) {
  const openIssues = project.issues?.filter((i) => i.status === "open" || i.status === "in_progress") ?? [];
  const criticalDiagnosis = project.diagnosis?.filter((d) => d.severity === "critical" || d.severity === "high") ?? [];

  const missingInfo: string[] = [];
  if ((project.documents?.length ?? 0) < 3) missingInfo.push("Insufficient project documents");
  if (!project.building?.currentCondition) missingInfo.push("Building condition not documented");
  if ((project.diagnosis?.length ?? 0) === 0) missingInfo.push("No diagnosis items recorded");
  if ((project.strategies?.length ?? 0) === 0) missingInfo.push("No renovation strategies generated");

  const nextActions = [
    criticalDiagnosis.length > 0 && "Review critical diagnosis items with structural engineer",
    openIssues.some((i) => i.priority === "urgent") && "Address urgent site safety issues",
    (project.strategies?.length ?? 0) > 0 && "Finalize renovation strategy selection",
    "Commission hazardous materials survey",
    "Upload remaining as-built drawings",
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Project Overview"
        description={`${project.name} — ${project.location}`}
      />

      <BuildingProfileCard project={project} building={project.building} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Renovation Goal</p>
            <p className="text-sm leading-relaxed">{project.renovationGoal}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-2">Project Status</p>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={project.status} />
              <RiskBadge level={project.riskLevel} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-2">Quick Stats</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-muted-foreground">Documents</span><p className="font-medium">{project.documents?.length ?? 0}</p></div>
              <div><span className="text-muted-foreground">Diagnosis</span><p className="font-medium">{project.diagnosis?.length ?? 0}</p></div>
              <div><span className="text-muted-foreground">Strategies</span><p className="font-medium">{project.strategies?.length ?? 0}</p></div>
              <div><span className="text-muted-foreground">Open Issues</span><p className="font-medium">{openIssues.length}</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {missingInfo.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileWarning className="h-4 w-4 text-amber-600" />
              <p className="text-sm font-medium text-amber-800">Missing Information</p>
            </div>
            <ul className="space-y-1">
              {missingInfo.map((item) => (
                <li key={item} className="text-xs text-amber-700 flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-amber-500" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <SectionHeader title="Recent Issues" />
          {openIssues.length > 0 ? (
            <div className="space-y-3">
              {openIssues.slice(0, 3).map((issue) => (
                <IssueCard key={issue.id} issue={issue} compact />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No open issues</p>
          )}
        </div>

        <div>
          <SectionHeader title="Recommended Next Actions" />
          <div className="space-y-2">
            {nextActions.slice(0, 5).map((action, i) => (
              <div key={i} className="flex items-start gap-2 rounded-md border p-3 text-xs">
                <CheckCircle2 className="h-4 w-4 text-sage shrink-0 mt-0.5" />
                <span>{action}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
