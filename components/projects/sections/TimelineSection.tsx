import { SectionHeader } from "@/components/app/SectionHeader";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/app/StatusBadge";
import { formatDate } from "@/lib/utils";
import type { ProjectWithRelations } from "@/types";
import { CheckCircle2, Circle } from "lucide-react";

interface TimelineSectionProps {
  project: ProjectWithRelations;
}

const PHASES = [
  { status: "draft", label: "Project Initiation", description: "Create project and gather basic information" },
  { status: "survey", label: "Site Survey", description: "Document existing conditions and upload records" },
  { status: "diagnosis", label: "Building Diagnosis", description: "Identify issues across all building systems" },
  { status: "strategy", label: "Strategy Development", description: "Generate and compare renovation strategies" },
  { status: "design", label: "Schematic Design", description: "Develop design based on selected strategy" },
  { status: "construction", label: "Construction", description: "Renovation execution and site issue tracking" },
  { status: "completed", label: "Completion", description: "Project handover and documentation" },
];

const STATUS_ORDER = ["draft", "survey", "diagnosis", "strategy", "design", "construction", "completed"];

export function TimelineSection({ project }: TimelineSectionProps) {
  const currentIndex = STATUS_ORDER.indexOf(project.status);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Project Timeline"
        description="Renovation workflow phases and current progress"
      />

      <div className="relative space-y-0">
        {PHASES.map((phase, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;

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
                {index < PHASES.length - 1 && (
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
          Project created {formatDate(project.createdAt)} · Last updated {formatDate(project.updatedAt)}
        </CardContent>
      </Card>
    </div>
  );
}
