"use client";

import { SectionHeader } from "@/components/app/SectionHeader";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/app/StatusBadge";
import { formatDate } from "@/lib/utils";
import type { ProjectWithRelations } from "@/types";
import { CheckCircle2, Circle } from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";

interface TimelineSectionProps {
  project: ProjectWithRelations;
}

const STATUS_ORDER = [
  "draft",
  "survey",
  "diagnosis",
  "strategy",
  "design",
  "construction",
  "completed",
];

export function TimelineSection({ project }: TimelineSectionProps) {
  const { t } = useLocale();
  const currentIndex = STATUS_ORDER.indexOf(project.status);

  const phases = [
    {
      status: "draft",
      label: t("Project Initiation", "项目启动"),
      description: t(
        "Create project and gather basic information",
        "创建项目并收集基本信息"
      ),
    },
    {
      status: "survey",
      label: t("Site Survey", "现场勘察"),
      description: t(
        "Document existing conditions and upload records",
        "记录现状并上传资料"
      ),
    },
    {
      status: "diagnosis",
      label: t("Building Diagnosis", "建筑诊断"),
      description: t(
        "Identify issues across all building systems",
        "识别各系统问题"
      ),
    },
    {
      status: "strategy",
      label: t("Strategy Development", "策略制定"),
      description: t(
        "Generate and compare renovation strategies",
        "生成并对比改造方案"
      ),
    },
    {
      status: "design",
      label: t("Schematic Design", "方案设计"),
      description: t(
        "Develop design based on selected strategy",
        "基于选定方案深化设计"
      ),
    },
    {
      status: "construction",
      label: t("Construction", "施工阶段"),
      description: t(
        "Renovation execution and site issue tracking",
        "改造实施与现场问题跟踪"
      ),
    },
    {
      status: "completed",
      label: t("Completion", "竣工交付"),
      description: t(
        "Project handover and documentation",
        "项目移交与归档"
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Project Timeline"
        titleZh="项目时间线"
        description="Renovation workflow phases and current progress"
        descriptionZh="改造流程阶段与当前进度"
      />

      <div className="relative space-y-0">
        {phases.map((phase, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={phase.status} className="flex gap-4 pb-8 last:pb-0">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    isComplete
                      ? "border-sage bg-sage text-white"
                      : isCurrent
                        ? "border-copper bg-copper text-white"
                        : "border-muted bg-background text-muted-foreground"
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Circle className="h-3 w-3" />
                  )}
                </div>
                {index < phases.length - 1 && (
                  <div
                    className={`w-0.5 flex-1 min-h-[40px] ${
                      isComplete ? "bg-sage" : "bg-border"
                    }`}
                  />
                )}
              </div>

              <Card className={`flex-1 ${isCurrent ? "border-copper/40" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium">{phase.label}</h3>
                    {isCurrent && <StatusBadge status={project.status} />}
                  </div>
                  <p className="text-xs text-muted-foreground">{phase.description}</p>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-4 text-xs text-muted-foreground">
          {t("Project created", "项目创建于")} {formatDate(project.createdAt)} ·{" "}
          {t("Last updated", "最后更新")} {formatDate(project.updatedAt)}
        </CardContent>
      </Card>
    </div>
  );
}
