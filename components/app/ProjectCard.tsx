import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { RiskBadge } from "./RiskBadge";
import { StatusBadge } from "./StatusBadge";
import { ScoreRing } from "./ScoreRing";
import { formatArea } from "@/lib/utils";
import type { Project } from "@/types";
import { MapPin, Building2, ArrowUpRight } from "lucide-react";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
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
          </div>

          <p className="mb-4 line-clamp-2 text-xs text-foreground/80">
            {project.renovationGoal}
          </p>

          <div className="mb-4 flex items-center gap-4">
            <ScoreRing score={project.healthScore} label="Health" size={52} />
            <ScoreRing score={project.potentialScore} label="Potential" size={52} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={project.status} />
            <RiskBadge level={project.riskLevel} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
