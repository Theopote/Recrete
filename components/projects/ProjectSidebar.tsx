"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ProjectSection } from "@/types";
import {
  LayoutDashboard,
  Brain,
  ClipboardList,
  Stethoscope,
  FlaskConical,
  Scale,
  AlertTriangle,
  FileBarChart,
  Bot,
  Box,
} from "lucide-react";

const sections: {
  id: ProjectSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "building-memory", label: "Building Memory", icon: Brain },
  { id: "survey-intelligence", label: "Survey Intelligence", icon: ClipboardList },
  { id: "bim-viewer", label: "BIM Viewer", icon: Box },
  { id: "diagnosis", label: "Diagnosis", icon: Stethoscope },
  { id: "expert-agents", label: "Expert Agents", icon: Bot },
  { id: "strategy-lab", label: "Strategy Lab", icon: FlaskConical },
  { id: "cost-risk", label: "Cost & Risk", icon: Scale },
  { id: "issues", label: "Issues", icon: AlertTriangle },
  { id: "reports", label: "Reports", icon: FileBarChart },
];

interface ProjectSidebarProps {
  projectId: string;
}

export function ProjectSidebar({ projectId }: ProjectSidebarProps) {
  const searchParams = useSearchParams();
  const rawSection = searchParams.get("section") as ProjectSection | null;
  const legacyMap: Record<string, ProjectSection> = {
    building: "building-memory",
    documents: "survey-intelligence",
    strategies: "strategy-lab",
    timeline: "overview",
  };
  const currentSection =
    (rawSection && legacyMap[rawSection]) ||
    rawSection ||
    "overview";

  return (
    <aside className="w-48 shrink-0 border-r bg-muted/30 p-3">
      <nav className="space-y-0.5">
        {sections.map((section) => {
          const href = `/projects/${projectId}?section=${section.id}`;
          const isActive = currentSection === section.id;

          return (
            <Link
              key={section.id}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <section.icon className="h-3.5 w-3.5" />
              {section.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
