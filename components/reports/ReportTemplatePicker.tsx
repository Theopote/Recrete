"use client";

import { cn } from "@/lib/utils";
import { pickLocaleText } from "@/lib/i18n/locale";
import { REPORT_TEMPLATE_CATALOG } from "@/lib/ai/report-templates";
import { useUIStore } from "@/lib/stores/ui-store";
import type { ReportType } from "@/types";
import { FileText } from "lucide-react";

interface ReportTemplatePickerProps {
  value: ReportType;
  onChange: (type: ReportType) => void;
  className?: string;
}

export function ReportTemplatePicker({ value, onChange, className }: ReportTemplatePickerProps) {
  const locale = useUIStore((s) => s.locale);

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3", className)}>
      {REPORT_TEMPLATE_CATALOG.map((template) => {
        const selected = value === template.type;
        const title = pickLocaleText(locale, template.titleEn, template.titleZh);
        const description = pickLocaleText(
          locale,
          template.descriptionEn,
          template.descriptionZh
        );
        const audience = pickLocaleText(
          locale,
          template.audienceEn ?? "",
          template.audienceZh
        );

        return (
          <button
            key={template.type}
            type="button"
            onClick={() => onChange(template.type)}
            className={cn(
              "text-left rounded-lg border p-3 transition-colors",
              selected
                ? "border-copper bg-copper/5 ring-1 ring-copper/30"
                : "hover:border-copper/30"
            )}
          >
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-copper shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-medium">{title}</p>
                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                  {description}
                </p>
                {audience && (
                  <p className="text-[10px] text-muted-foreground/80 mt-1">
                    {locale === "zh" ? "适用：" : "For: "}
                    {audience}
                  </p>
                )}
                <div className="flex flex-wrap gap-1 mt-2">
                  {template.sections.slice(0, 3).map((section) => (
                    <span
                      key={section}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                    >
                      {section}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
