import { cn } from "@/lib/utils";
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
  return (
    <div className={cn("flex items-start justify-between gap-4 mb-6", className)}>
      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          {Icon && <Icon className="h-4 w-4 text-copper" />}
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {titleZh && (
            <span className="text-xs font-normal text-muted-foreground">· {titleZh}</span>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground max-w-xl">{description}</p>
        )}
        {descriptionZh && (
          <p className="text-[10px] text-muted-foreground/80 max-w-xl">{descriptionZh}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
