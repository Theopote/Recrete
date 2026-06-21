"use client";

import { Bell, Plus, Sparkles, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { GlobalSearch } from "./GlobalSearch";
import { useUIStore } from "@/lib/stores/ui-store";
import { useSession, signOut } from "next-auth/react";
import { getInitials } from "@/lib/utils";

interface TopBarProps {
  title: string;
  subtitle?: string;
  showNewProject?: boolean;
  showAiToggle?: boolean;
}

export function TopBar({ title, subtitle, showNewProject = false, showAiToggle = false }: TopBarProps) {
  const { aiPanelOpen, toggleAiPanel } = useUIStore();
  const { data: session } = useSession();
  const initials = session?.user?.name ? getInitials(session.user.name) : "U";

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
          <Button variant="copper" size="sm" className="gap-1.5" asChild>
            <Link href="/projects/new">
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New Project</span>
            </Link>
          </Button>
        )}

        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground"
            title={session?.user?.email ?? undefined}
          >
            {initials}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hidden sm:flex"
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
