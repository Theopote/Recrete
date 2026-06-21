"use client";

import { cn } from "@/lib/utils";

interface DwgSvgViewerProps {
  previewUrl: string;
  className?: string;
}

export function DwgSvgViewer({ previewUrl, className }: DwgSvgViewerProps) {
  return (
    <div
      className={cn(
        "relative h-full min-h-[420px] w-full overflow-hidden rounded-md border bg-white",
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={previewUrl}
        alt="DWG preview"
        className="h-full w-full object-contain"
      />
    </div>
  );
}
