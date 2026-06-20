import { BuildingProfileCard } from "@/components/app/BuildingProfileCard";
import { SectionHeader } from "@/components/app/SectionHeader";
import { Card, CardContent } from "@/components/ui/card";
import type { ProjectWithRelations } from "@/types";

interface BuildingSectionProps {
  project: ProjectWithRelations;
}

export function BuildingSection({ project }: BuildingSectionProps) {
  const building = project.building;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Building Profile"
        description="Asset card and existing condition documentation"
      />

      <BuildingProfileCard project={project} building={building} />

      {building && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="text-sm font-medium">Physical Attributes</h3>
              <dl className="grid grid-cols-2 gap-3 text-xs">
                <Detail label="Address" value={building.address} className="col-span-2" />
                <Detail label="Construction Year" value={String(building.constructionYear)} />
                <Detail label="Structure Type" value={building.structureType} />
                <Detail label="Floor Count" value={String(building.floorCount)} />
                <Detail label="Basement Levels" value={String(building.basementCount)} />
                <Detail label="Gross Floor Area" value={`${building.grossFloorArea.toLocaleString()} sqm`} />
                <Detail label="Heritage Level" value={building.heritageLevel.replace(/_/g, " ")} />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="text-sm font-medium">Function History</h3>
              <dl className="space-y-3 text-xs">
                <Detail label="Original Function" value={project.originalFunction} />
                <Detail label="Current Function" value={project.currentFunction} />
                <Detail label="Target Function" value={project.targetFunction} />
              </dl>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardContent className="p-5">
              <h3 className="text-sm font-medium mb-2">Current Condition Assessment</h3>
              <p className="text-xs leading-relaxed text-foreground/80">
                {building.currentCondition}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium mt-0.5">{value}</dd>
    </div>
  );
}
