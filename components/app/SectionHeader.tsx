"use client";

import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/stores/ui-store";
import { pickLocaleText } from "@/lib/i18n/locale";
import type { LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  titleZh?: string;
  description?: string;
  descriptionZh?: string;
  action?: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
}

export function SectionHeader({
  title,
  titleZh,
  description,
  descriptionZh,
  action,
  icon: Icon,
  className,
}: SectionHeaderProps) {
  const locale = useUIStore((s) => s.locale);
  const primaryTitle = pickLocaleText(locale, title, titleZh);
  const primaryDescription = pickLocaleText(locale, description ?? "", descriptionZh);

  return (
    <div className={cn("flex items-start justify-between gap-4 mb-6", className)}>
      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          {Icon && <Icon className="h-4 w-4 text-copper" />}
          <h2 className="text-base font-semibold tracking-tight">{primaryTitle}</h2>
        </div>
        {primaryDescription && (
          <p className="text-xs text-muted-foreground max-w-xl">{primaryDescription}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
