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
  { href: "/survey", label: "Survey", icon: ClipboardList },
  { href: "/diagnosis", label: "Diagnosis", icon: Stethoscope },
  { href: "/strategies", label: "Design Strategies", icon: Lightbulb },
  { href: "/issues", label: "Issues", icon: AlertTriangle },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/knowledge", label: "Knowledge Base", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 flex-col border-r bg-card shrink-0">
      <div className="flex h-14 items-center gap-2.5 border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Building2 className="h-4 w-4 text-primary-foreground" />
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
                  ? "bg-primary text-primary-foreground"
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
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Reimagine. Renew. Recreate.
          <br />
          <span className="text-muted-foreground/70">重构想象，焕新再造</span>
        </p>
      </div>
    </aside>
  );
}
