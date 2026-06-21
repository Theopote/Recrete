"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  FolderKanban,
  Brain,
  ClipboardList,
  Stethoscope,
  FlaskConical,
  Scale,
  AlertTriangle,
  FileText,
  BookOpen,
  Settings,
  Building2,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "AI Command Center", icon: Sparkles },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/survey", label: "Survey Intelligence", icon: ClipboardList },
  { href: "/diagnosis", label: "Diagnosis", icon: Stethoscope },
  { href: "/strategies", label: "Strategy Lab", icon: FlaskConical },
  { href: "/issues", label: "Issues", icon: AlertTriangle },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/knowledge", label: "Knowledge Base", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 flex-col border-r border-border/80 bg-card/95 shadow-[12px_0_36px_-30px_black] shrink-0">
      <div className="flex h-14 items-center gap-2.5 border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-copper/35 bg-copper/10 shadow-[inset_0_0_18px_hsl(var(--copper)/0.08)]">
            <Building2 className="h-4 w-4 text-copper" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none tracking-tight">Recrete</p>
            <p className="text-[10px] text-muted-foreground">砼憶</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 p-3 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium transition-colors",
                isActive
                  ? "bg-copper/12 text-copper ring-1 ring-inset ring-copper/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <div className="mb-2 flex items-center gap-1.5">
          <Brain className="h-3 w-3 text-copper" />
          <p className="text-[10px] font-medium text-copper">AI Copilot for Existing Building Renovation</p>
        </div>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          面向既有建筑更新的 AI 设计助手
          <br />
          <span className="text-muted-foreground/70">Reimagine. Renew. Recreate. · 重构想象，焕新再造</span>
        </p>
      </div>
    </aside>
  );
}
