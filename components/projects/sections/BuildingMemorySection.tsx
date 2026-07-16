"use client";

import { SectionHeader } from "@/components/app/SectionHeader";
import { BuildingMemoryCard } from "@/components/ai/BuildingMemoryCard";
import { MissingInformationList } from "@/components/ai/MissingInformationList";
import { AIInsightList } from "@/components/ai/AIInsightList";
import { RecommendedActions } from "@/components/ai/RecommendedActions";
import { UpdateBuildingMemoryButton } from "@/components/ai/UpdateBuildingMemoryButton";
import { DataConflictPanel } from "@/components/ai/DataConflictPanel";
import { EmptyState } from "@/components/app/EmptyState";
import type { ProjectWithRelations } from "@/types";
import { Brain } from "lucide-react";
import { BuildingMemoryHistoryPanel } from "@/components/ai/BuildingMemoryHistoryPanel";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/use-locale";

interface BuildingMemorySectionProps {
  project: ProjectWithRelations;
}

export function BuildingMemorySection({ project }: BuildingMemorySectionProps) {
  const { t } = useLocale();
  const memory = project.buildingMemory;

  if (!memory) {
    return (
      <div className="space-y-4">
        <SectionHeader
          title="Building Memory"
          titleZh="砼憶 · 建筑记忆"
          description="Persistent AI understanding — what Recrete knows, doesn't know, and recommends next."
          descriptionZh="AI 已经知道什么、还不知道什么、关键风险、改造潜力与下一步建议。"
          action={<UpdateBuildingMemoryButton projectId={project.id} />}
        />
        <EmptyState
          icon={Brain}
          title={t("Building Memory not initialized", "建筑记忆尚未初始化")}
          description={t(
            "Run AI analysis to build persistent project intelligence.",
            "运行 AI 分析以建立持久化的项目智能。"
          )}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Building Memory"
        titleZh="砼憶 · 建筑记忆"
        description="Central intelligence layer — AI-maintained understanding of this building"
        descriptionZh="持续显示 AI 已知事实、缺失信息、关键风险、改造潜力与下一步任务。"
        action={<UpdateBuildingMemoryButton projectId={project.id} />}
      />

      <BuildingMemoryCard memory={memory} />

      {(project.buildingMemoryHistory?.length ?? 0) > 0 && (
        <BuildingMemoryHistoryPanel history={project.buildingMemoryHistory ?? []} />
      )}

      <DataConflictPanel project={project} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-4 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("Design Constraints", "设计约束")}
            </h4>
            <ul className="space-y-1.5">
              {memory.designConstraints.map((item, i) => (
                <li key={i} className="text-xs text-foreground/85">· {item}</li>
              ))}
            </ul>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pt-2">
              {t("Owner Requirements", "业主要求")}
            </h4>
            <ul className="space-y-1.5">
              {memory.ownerRequirements.map((item, i) => (
                <li key={i} className="text-xs text-foreground/85">· {item}</li>
              ))}
            </ul>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pt-2">
              {t("Important Decisions", "重要决策")}
            </h4>
            <ul className="space-y-1.5">
              {memory.importantDecisions.map((item, i) => (
                <li key={i} className="text-xs text-foreground/85">· {item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <MissingInformationList items={memory.missingInformation} />
          <RecommendedActions tasks={project.tasks ?? []} projectId={project.id} />
        </div>
      </div>

      <div>
        <SectionHeader
          title="Related AI Insights"
          titleZh="相关 AI 洞察"
        />
        <AIInsightList insights={project.insights ?? []} compact />
      </div>
    </div>
  );
}
