"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  ClipboardList,
  Stethoscope,
  Lightbulb,
  AlertTriangle,
  FileText,
  BookOpen,
  Settings,
  Building2,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/survey", label: "Survey", icon: ClipboardList, disabled: true },
  { href: "/diagnosis", label: "Diagnosis", icon: Stethoscope, disabled: true },
  { href: "/strategies", label: "Design Strategies", icon: Lightbulb, disabled: true },
  { href: "/issues", label: "Issues", icon: AlertTriangle, disabled: true },
  { href: "/reports", label: "Reports", icon: FileText, disabled: true },
  { href: "/knowledge", label: "Knowledge Base", icon: BookOpen, disabled: true },
  { href: "/settings", label: "Settings", icon: Settings, disabled: true },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 flex-col border-r bg-card">
      <div className="flex h-14 items-center gap-2.5 border-b px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
          <Building2 className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none tracking-tight">Recrete</p>
          <p className="text-[10px] text-muted-foreground">砼憶</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 p-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          if (item.disabled) {
            return (
              <div
                key={item.href}
                className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs text-muted-foreground/50 cursor-not-allowed"
                title="Available within project workspace"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Reimagine. Renew. Recreate.
          <br />
          <span className="text-muted-foreground/70">重构想象，焕新再造</span>
        </p>
      </div>
    </aside>
  );
}
