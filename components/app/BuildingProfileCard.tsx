import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreRing } from "./ScoreRing";
import { RiskBadge } from "./RiskBadge";
import { StatusBadge } from "./StatusBadge";
import { formatArea } from "@/lib/utils";
import type { Project, Building } from "@/types";
import { Building2, Calendar, Layers, MapPin } from "lucide-react";

interface BuildingProfileCardProps {
  project: Project;
  building?: Building | null;
}

export function BuildingProfileCard({ project, building }: BuildingProfileCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-concrete via-copper to-sage" />
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{building?.name ?? project.name}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground font-mono">{project.code}</p>
          </div>
          <div className="flex gap-3">
            <ScoreRing score={project.healthScore} label="Health" size={56} />
            <ScoreRing score={project.potentialScore} label="Potential" size={56} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <InfoItem icon={MapPin} label="Location" value={project.location} />
          <InfoItem icon={Building2} label="Type" value={project.buildingType} />
          <InfoItem icon={Calendar} label="Built" value={String(project.constructionYear)} />
          <InfoItem icon={Layers} label="Structure" value={project.structureType} />
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-md bg-muted/50 p-3 text-xs">
          <div>
            <span className="text-muted-foreground">Original</span>
            <p className="font-medium">{project.originalFunction}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Current</span>
            <p className="font-medium">{project.currentFunction}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Target</span>
            <p className="font-medium text-copper">{project.targetFunction}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>{project.floorCount} floors</span>
          <span>{formatArea(project.grossFloorArea)}</span>
          {building && <span>{building.basementCount} basement</span>}
        </div>

        {building?.currentCondition && (
          <p className="text-xs leading-relaxed text-foreground/80 border-l-2 border-copper/30 pl-3">
            {building.currentCondition}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <StatusBadge status={project.status} />
          <RiskBadge level={project.riskLevel} />
        </div>
      </CardContent>
    </Card>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <div>
        <span className="text-muted-foreground">{label}</span>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}
