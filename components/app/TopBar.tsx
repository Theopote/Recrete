"use client";

import { Bell, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

interface TopBarProps {
  title: string;
  subtitle?: string;
  showNewProject?: boolean;
}

export function TopBar({ title, subtitle, showNewProject = false }: TopBarProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-card/80 backdrop-blur-sm px-6">
      <div>
        <h1 className="text-sm font-semibold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects, documents..."
            className="h-8 w-64 pl-8 text-xs"
          />
        </div>

        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Bell className="h-4 w-4" />
        </Button>

        {showNewProject && (
          <Link href="/projects/new">
            <Button variant="copper" size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              New Project
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
