"use client";

import { Bell, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { GlobalSearch } from "./GlobalSearch";
import { useUIStore } from "@/lib/stores/ui-store";

interface TopBarProps {
  title: string;
  subtitle?: string;
  showNewProject?: boolean;
  showAiToggle?: boolean;
}

export function TopBar({ title, subtitle, showNewProject = false, showAiToggle = false }: TopBarProps) {
  const { aiPanelOpen, toggleAiPanel } = useUIStore();

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card/80 backdrop-blur-sm px-4 md:px-6 shrink-0">
      <div className="min-w-0">
        <h1 className="text-sm font-semibold tracking-tight truncate">{title}</h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        <GlobalSearch />

        {showAiToggle && (
          <Button
            variant={aiPanelOpen ? "copper" : "outline"}
            size="sm"
            className="gap-1.5 hidden lg:flex"
            onClick={toggleAiPanel}
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI
          </Button>
        )}

        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Bell className="h-4 w-4" />
        </Button>

        {showNewProject && (
          <Link href="/projects/new">
            <Button variant="copper" size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New Project</span>
            </Button>
          </Link>
        )}

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
          LW
        </div>
      </div>
    </header>
  );
}
