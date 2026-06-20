"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ProjectSection } from "@/types";
import {
  LayoutDashboard,
  Building2,
  FileText,
  Stethoscope,
  Lightbulb,
  AlertTriangle,
  FileBarChart,
  Clock,
} from "lucide-react";

const sections: { id: ProjectSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "building", label: "Building Profile", icon: Building2 },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "diagnosis", label: "Diagnosis", icon: Stethoscope },
  { id: "strategies", label: "Strategies", icon: Lightbulb },
  { id: "issues", label: "Issues", icon: AlertTriangle },
  { id: "reports", label: "Reports", icon: FileBarChart },
  { id: "timeline", label: "Timeline", icon: Clock },
];

interface ProjectSidebarProps {
  projectId: string;
}

export function ProjectSidebar({ projectId }: ProjectSidebarProps) {
  const searchParams = useSearchParams();
  const currentSection = (searchParams.get("section") as ProjectSection) || "overview";

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
