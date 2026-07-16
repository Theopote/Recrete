"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";
import { useLocale } from "@/lib/i18n/use-locale";
import { APP_NAV_LABELS, navLabel, type AppNavHref } from "@/lib/i18n/nav";
import {
  Sparkles,
  FolderKanban,
  Brain,
  ClipboardList,
  Stethoscope,
  FlaskConical,
  AlertTriangle,
  FileText,
  BookOpen,
  Settings,
  Building2,
} from "lucide-react";

const navItems: { href: AppNavHref; icon: typeof Sparkles }[] = [
  { href: "/dashboard", icon: Sparkles },
  { href: "/projects", icon: FolderKanban },
  { href: "/survey", icon: ClipboardList },
  { href: "/diagnosis", icon: Stethoscope },
  { href: "/strategies", icon: FlaskConical },
  { href: "/issues", icon: AlertTriangle },
  { href: "/reports", icon: FileText },
  { href: "/knowledge", icon: BookOpen },
  { href: "/settings", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { canAccessRoute } = usePermissions();
  const { locale, t } = useLocale();

  const visibleItems = navItems.filter((item) => canAccessRoute(item.href));

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
        {visibleItems.map((item) => {
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
              {navLabel(locale, APP_NAV_LABELS[item.href])}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <div className="mb-2 flex items-center gap-1.5">
          <Brain className="h-3 w-3 text-copper" />
          <p className="text-[10px] font-medium text-copper">
            {t(
              "AI Copilot for Existing Building Renovation",
              "面向既有建筑更新的 AI 设计助手"
            )}
          </p>
        </div>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          {locale === "zh" ? (
            <>
              重构想象，焕新再造
              <br />
              <span className="text-muted-foreground/70">Reimagine. Renew. Recreate.</span>
            </>
          ) : (
            <>
              Reimagine. Renew. Recreate.
              <br />
              <span className="text-muted-foreground/70">重构想象，焕新再造</span>
            </>
          )}
        </p>
      </div>
    </aside>
  );
}
