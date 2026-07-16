"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/use-locale";
import type { DrawingAnalysisResult } from "@/lib/ai/vision/types";
import {
  computeDrawingBounds,
  normalizeBoundingBox,
  OVERLAY_LAYER_COLORS,
  OVERLAY_LAYER_STROKES,
  type OverlayLayer,
} from "@/lib/building-condition/drawing-viewer-utils";

type ReactPdfModule = typeof import("react-pdf");

interface DrawingAnalysisOverlayViewerProps {
  fileUrl: string;
  mimeType: string;
  analysis: DrawingAnalysisResult;
  pageNumber?: number;
  className?: string;
  activeLayers?: OverlayLayer[];
  bimPreviewUrl?: string | null;
}

export function DrawingAnalysisOverlayViewer({
  fileUrl,
  mimeType,
  analysis,
  pageNumber = 1,
  className,
  activeLayers = ["rooms", "structure", "annotations"],
  bimPreviewUrl,
}: DrawingAnalysisOverlayViewerProps) {
  const { t } = useLocale();
  const [reactPdf, setReactPdf] = useState<ReactPdfModule | null>(null);
  const isPdf = mimeType.includes("pdf");
  const isImage = mimeType.startsWith("image/");
  const isCad = mimeType.includes("acad") || mimeType.includes("dxf") || mimeType.includes("dwg");
  const cadPreview = bimPreviewUrl && (isCad || !isPdf);

  useEffect(() => {
    if (!isPdf) return;
    let active = true;
    void import("react-pdf").then((mod) => {
      if (!active) return;
      mod.pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${mod.pdfjs.version}/build/pdf.worker.min.mjs`;
      setReactPdf(mod);
    });
    return () => {
      active = false;
    };
  }, [isPdf]);

  const bounds = useMemo(() => computeDrawingBounds(analysis), [analysis]);

  const overlayRects = useMemo(() => {
    const items: {
      key: string;
      layer: OverlayLayer;
      label: string;
      rect: ReturnType<typeof normalizeBoundingBox>;
    }[] = [];

    if (activeLayers.includes("rooms")) {
      for (const room of analysis.rooms) {
        items.push({
          key: `room-${room.id}`,
          layer: "rooms",
          label: room.label,
          rect: normalizeBoundingBox(room.location, bounds),
        });
      }
    }
    if (activeLayers.includes("structure")) {
      for (const el of analysis.structuralElements) {
        items.push({
          key: `struct-${el.id ?? el.type}`,
          layer: "structure",
          label: el.id ?? el.type,
          rect: normalizeBoundingBox(el.location, bounds),
        });
      }
    }
    if (activeLayers.includes("annotations")) {
      for (const note of analysis.annotations) {
        items.push({
          key: `note-${note.text.slice(0, 24)}`,
          layer: "annotations",
          label: note.text,
          rect: normalizeBoundingBox(note.location, bounds),
        });
      }
    }
    if (activeLayers.includes("dimensions")) {
      for (const dim of analysis.dimensions) {
        items.push({
          key: `dim-${dim.value}-${dim.unit}`,
          layer: "dimensions",
          label: `${dim.value} ${dim.unit}`,
          rect: normalizeBoundingBox(dim.location, bounds),
        });
      }
    }
    return items;
  }, [activeLayers, analysis, bounds]);

  const renderOverlay = useCallback(
    () => (
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        {overlayRects.map((item) => (
          <g key={item.key}>
            <rect
              x={item.rect.x}
              y={item.rect.y}
              width={item.rect.width}
              height={item.rect.height}
              fill={OVERLAY_LAYER_COLORS[item.layer]}
              stroke={OVERLAY_LAYER_STROKES[item.layer]}
              strokeWidth={0.4}
              rx={0.5}
            >
              <title>{item.label}</title>
            </rect>
          </g>
        ))}
      </svg>
    ),
    [overlayRects]
  );

  if (!fileUrl) {
    return (
      <div
        className={cn(
          "flex min-h-[360px] items-center justify-center rounded-lg border bg-muted/20 text-xs text-muted-foreground",
          className
        )}
      >
        {t("No preview available", "无预览文件")}
      </div>
    );
  }

  if (cadPreview) {
    return (
      <div className={cn("relative overflow-hidden rounded-lg border bg-muted/10", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bimPreviewUrl!} alt="" className="block w-full object-contain max-h-[520px]" />
        {renderOverlay()}
      </div>
    );
  }

  if (isImage) {
    return (
      <div className={cn("relative overflow-hidden rounded-lg border bg-muted/10", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={fileUrl} alt="" className="block w-full object-contain max-h-[520px]" />
        {renderOverlay()}
      </div>
    );
  }

  if (isPdf && reactPdf) {
    const { Document, Page } = reactPdf;
    return (
      <div className={cn("relative overflow-hidden rounded-lg border bg-muted/20", className)}>
        <Document file={fileUrl} loading={null} error={null}>
          <Page
            pageNumber={pageNumber}
            width={720}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
        <div className="pointer-events-none absolute inset-0">{renderOverlay()}</div>
      </div>
    );
  }

  if (isPdf && !reactPdf) {
    return (
      <div
        className={cn(
          "flex min-h-[360px] items-center justify-center rounded-lg border bg-muted/20 text-xs text-muted-foreground",
          className
        )}
      >
        {t("Loading PDF preview...", "加载 PDF 预览...")}
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-lg border bg-muted/10 p-4", className)}>
      <div className="relative mx-auto aspect-[4/3] max-w-lg rounded-md border border-dashed border-muted-foreground/30 bg-background/50">
        <div className="absolute inset-0 grid grid-cols-8 grid-rows-6 opacity-20">
          {Array.from({ length: 48 }).map((_, i) => (
            <div key={i} className="border border-muted-foreground/20" />
          ))}
        </div>
        {renderOverlay()}
        <p className="absolute bottom-2 left-2 right-2 text-center text-[10px] text-muted-foreground">
          {t(
            "Schematic AI extraction overlay (upload PDF/image for full preview)",
            "AI 抽取示意叠加层（上传 PDF/图片后可显示完整预览）"
          )}
        </p>
      </div>
    </div>
  );
}
