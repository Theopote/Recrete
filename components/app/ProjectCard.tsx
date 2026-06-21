import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { RiskBadge } from "./RiskBadge";
import { StatusBadge } from "./StatusBadge";
import { ScoreRing } from "./ScoreRing";
import { AIReadinessScore } from "@/components/ai/AIReadinessScore";
import { DataCompletenessScore } from "@/components/ai/DataCompletenessScore";
import { formatArea } from "@/lib/utils";
import { getProjectNextAction, getProjectTopRisk } from "@/lib/mock-data/ai-native";
import type { Project } from "@/types";
import { MapPin, Building2, ArrowUpRight, AlertTriangle } from "lucide-react";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const topRisk = getProjectTopRisk(project.id);
  const nextAction = getProjectNextAction(project.id);

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="group h-full transition-all hover:border-copper/40 hover:shadow-md">
        <CardContent className="p-5">
          <div className="mb-3 flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold leading-tight group-hover:text-copper transition-colors">
                {project.name}
              </h3>
              <p className="text-xs text-muted-foreground font-mono">{project.code}</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          <div className="mb-4 space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3" />
              {project.location}
            </div>
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3 w-3" />
              {project.buildingType} · {project.constructionYear} · {formatArea(project.grossFloorArea)}
            </div>
            <p className="text-foreground/70">Target: {project.targetFunction}</p>
          </div>

          <div className="mb-4 flex items-center gap-3 flex-wrap">
            <ScoreRing score={project.healthScore} label="Health" size={48} />
            <ScoreRing score={project.potentialScore} label="Potential" size={48} />
            <AIReadinessScore score={project.aiReadinessScore} size={48} />
          </div>

          <div className="mb-3">
            <DataCompletenessScore score={project.dataCompletenessScore} />
          </div>

          {topRisk && (
            <div className="mb-3 flex items-start gap-1.5 rounded-md bg-red-500/5 border border-red-500/10 p-2">
              <AlertTriangle className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-red-700 dark:text-red-400 line-clamp-2">{topRisk}</p>
            </div>
          )}

          <p className="mb-4 text-[10px] text-muted-foreground line-clamp-2">
            <span className="font-medium text-foreground">Next:</span> {nextAction}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={project.status} />
            <RiskBadge level={project.riskLevel} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
