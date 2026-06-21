import { SectionHeader } from "@/components/app/SectionHeader";
import { BuildingMemoryCard } from "@/components/ai/BuildingMemoryCard";
import { MissingInformationList } from "@/components/ai/MissingInformationList";
import { AIInsightList } from "@/components/ai/AIInsightList";
import { RecommendedActions } from "@/components/ai/RecommendedActions";
import { UpdateBuildingMemoryButton } from "@/components/ai/UpdateBuildingMemoryButton";
import { EmptyState } from "@/components/app/EmptyState";
import type { ProjectWithRelations } from "@/types";
import { Brain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface BuildingMemorySectionProps {
  project: ProjectWithRelations;
}

export function BuildingMemorySection({ project }: BuildingMemorySectionProps) {
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
          title="Building Memory not initialized"
          description="Run AI analysis to build persistent project intelligence."
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-4 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Design Constraints
            </h4>
            <ul className="space-y-1.5">
              {memory.designConstraints.map((item, i) => (
                <li key={i} className="text-xs text-foreground/85">· {item}</li>
              ))}
            </ul>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pt-2">
              Owner Requirements
            </h4>
            <ul className="space-y-1.5">
              {memory.ownerRequirements.map((item, i) => (
                <li key={i} className="text-xs text-foreground/85">· {item}</li>
              ))}
            </ul>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pt-2">
              Important Decisions
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
        <SectionHeader title="Related AI Insights" />
        <AIInsightList insights={project.insights ?? []} compact />
      </div>
    </div>
  );
}
