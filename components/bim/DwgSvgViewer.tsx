"use client";

import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/use-locale";

interface DwgSvgViewerProps {
  previewUrl: string;
  className?: string;
}

export function DwgSvgViewer({ previewUrl, className }: DwgSvgViewerProps) {
  const { t } = useLocale();

  return (
    <div
      className={cn(
        "relative h-full min-h-[420px] w-full overflow-hidden rounded-md border bg-[#11151b]",
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={previewUrl}
        alt={t("DWG preview", "DWG 预览")}
        className="h-full w-full object-contain"
      />
    </div>
  );
}
