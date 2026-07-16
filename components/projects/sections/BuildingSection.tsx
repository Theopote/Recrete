"use client";

import { BuildingProfileCard } from "@/components/app/BuildingProfileCard";
import { SectionHeader } from "@/components/app/SectionHeader";
import { Card, CardContent } from "@/components/ui/card";
import type { ProjectWithRelations } from "@/types";
import { useLocale } from "@/lib/i18n/use-locale";

interface BuildingSectionProps {
  project: ProjectWithRelations;
}

export function BuildingSection({ project }: BuildingSectionProps) {
  const { t } = useLocale();
  const building = project.building;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Building Profile"
        titleZh="建筑档案"
        description="Asset card and existing condition documentation"
        descriptionZh="资产卡片与现状情况记录"
      />

      <BuildingProfileCard project={project} building={building} />

      {building && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="text-sm font-medium">{t("Physical Attributes", "物理属性")}</h3>
              <dl className="grid grid-cols-2 gap-3 text-xs">
                <Detail
                  label={t("Address", "地址")}
                  value={building.address}
                  className="col-span-2"
                />
                <Detail
                  label={t("Construction Year", "建造年份")}
                  value={String(building.constructionYear)}
                />
                <Detail
                  label={t("Structure Type", "结构类型")}
                  value={building.structureType}
                />
                <Detail label={t("Floor Count", "层数")} value={String(building.floorCount)} />
                <Detail
                  label={t("Basement Levels", "地下层数")}
                  value={String(building.basementCount)}
                />
                <Detail
                  label={t("Gross Floor Area", "总建筑面积")}
                  value={`${building.grossFloorArea.toLocaleString()} sqm`}
                />
                <Detail
                  label={t("Heritage Level", "文保等级")}
                  value={building.heritageLevel.replace(/_/g, " ")}
                />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="text-sm font-medium">{t("Function History", "功能沿革")}</h3>
              <dl className="space-y-3 text-xs">
                <Detail
                  label={t("Original Function", "原功能")}
                  value={project.originalFunction}
                />
                <Detail
                  label={t("Current Function", "现功能")}
                  value={project.currentFunction}
                />
                <Detail
                  label={t("Target Function", "目标功能")}
                  value={project.targetFunction}
                />
              </dl>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardContent className="p-5">
              <h3 className="text-sm font-medium mb-2">
                {t("Current Condition Assessment", "现状评估")}
              </h3>
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

function Detail({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium mt-0.5">{value}</dd>
    </div>
  );
}
