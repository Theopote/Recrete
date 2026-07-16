"use client";

import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";
import { useLocale } from "@/lib/i18n/use-locale";
import { navLabel, PROJECT_SECTION_LABELS } from "@/lib/i18n/nav";
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
  Users,
} from "lucide-react";
import type { ProjectSection } from "@/types";

const sections: {
  id: ProjectSection;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "overview", icon: LayoutDashboard },
  { id: "building-memory", icon: Brain },
  { id: "survey-intelligence", icon: ClipboardList },
  { id: "bim-viewer", icon: Box },
  { id: "diagnosis", icon: Stethoscope },
  { id: "expert-agents", icon: Bot },
  { id: "strategy-lab", icon: FlaskConical },
  { id: "collaboration", icon: Users },
  { id: "cost-risk", icon: Scale },
  { id: "issues", icon: AlertTriangle },
  { id: "reports", icon: FileBarChart },
];

interface ProjectSidebarProps {
  projectId: string;
}

export function ProjectSidebar({ projectId }: ProjectSidebarProps) {
  const { canAccessSection } = usePermissions();
  const { locale } = useLocale();
  const visibleSections = sections.filter((s) => canAccessSection(s.id));
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
        {visibleSections.map((section) => {
          const href = `/projects/${projectId}?section=${section.id}`;
          const isActive = currentSection === section.id;

          return (
            <a
              key={section.id}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium transition-colors no-underline",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <section.icon className="h-3.5 w-3.5" />
              {navLabel(locale, PROJECT_SECTION_LABELS[section.id])}
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
