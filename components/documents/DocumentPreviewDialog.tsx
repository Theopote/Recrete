"use client";

import { useState, useCallback, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/use-locale";
import { documentCategoryLabels, documentCategoryLabelsZh } from "@/lib/utils/labels";
import type { DocumentAsset } from "@/types";
import { DocumentGovernancePanel } from "@/components/documents/DocumentGovernancePanel";
import { DocumentStructuredFactsPanel } from "@/components/documents/DocumentStructuredFactsPanel";

interface PdfViewerProps {
  fileUrl: string;
  className?: string;
}

type ReactPdfModule = typeof import("react-pdf");

function PdfViewer({ fileUrl, className }: PdfViewerProps) {
  const { t } = useLocale();
  const [reactPdf, setReactPdf] = useState<ReactPdfModule | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1.0);

  useEffect(() => {
    let active = true;
    void import("react-pdf").then((mod) => {
      if (!active) return;
      mod.pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${mod.pdfjs.version}/build/pdf.worker.min.mjs`;
      setReactPdf(mod);
    });
    return () => {
      active = false;
    };
  }, []);

  const onLoadSuccess = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
    setPage(1);
  }, []);

  if (!reactPdf) {
    return (
      <div className={cn("flex items-center justify-center min-h-[400px]", className)}>
        <p className="text-xs text-muted-foreground p-8">{t("Loading PDF viewer...", "加载 PDF 查看器...")}</p>
      </div>
    );
  }

  const { Document, Page } = reactPdf;

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-center justify-between border-b px-3 py-2 bg-muted/30">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs tabular-nums min-w-[80px] text-center">
            {page} / {numPages || "—"}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={page >= numPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}>
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="text-[10px] tabular-nums w-10 text-center">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setScale((s) => Math.min(2, s + 0.1))}>
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <a href={fileUrl} download target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Download className="h-3.5 w-3.5" />
            </Button>
          </a>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-concrete-light/30 flex justify-center p-4 min-h-[400px]">
        <Document file={fileUrl} onLoadSuccess={onLoadSuccess} loading={
          <p className="text-xs text-muted-foreground p-8">{t("Loading PDF...", "加载 PDF...")}</p>
        } error={
          <p className="text-xs text-destructive p-8">{t("Failed to load PDF preview.", "PDF 预览加载失败。")}</p>
        }>
          <Page pageNumber={page} scale={scale} renderTextLayer={false} renderAnnotationLayer={false} />
        </Document>
      </div>
    </div>
  );
}

interface DocumentPreviewDialogProps {
  document: DocumentAsset | null;
  projectId?: string;
  onClose: () => void;
  onDocumentUpdated?: (document: DocumentAsset) => void;
}

export function DocumentPreviewDialog({
  document,
  projectId,
  onClose,
  onDocumentUpdated,
}: DocumentPreviewDialogProps) {
  const { t, label } = useLocale();
  if (!document) return null;

  const isPdf = document.mimeType === "application/pdf" || document.name.toLowerCase().endsWith(".pdf");
  const isImage = document.mimeType.startsWith("image/");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 flex flex-col w-full max-w-4xl max-h-[90vh] mx-4 rounded-lg border bg-card shadow-xl overflow-hidden">
        <div className="flex items-center justify-between border-b px-4 py-3 shrink-0">
          <div className="min-w-0">
            <h3 className="text-sm font-medium truncate">{document.name}</h3>
            <p className="text-[10px] text-muted-foreground">
              {label(
                documentCategoryLabels,
                documentCategoryLabelsZh,
                document.category as keyof typeof documentCategoryLabels
              )}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {isPdf ? (
          <PdfViewer fileUrl={document.fileUrl} className="flex-1 min-h-0" />
        ) : isImage ? (
          <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-muted/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={document.fileUrl} alt={document.name} className="max-w-full max-h-[70vh] object-contain" />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <p className="text-sm text-muted-foreground mb-4">{t("Preview not available for this file type.", "此文件类型不支持预览。")}</p>
            <a href={document.fileUrl} download target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">{t("Download File", "下载文件")}</Button>
            </a>
          </div>
        )}

        {projectId && document && (
          <>
            <DocumentStructuredFactsPanel document={document} />
            <DocumentGovernancePanel
              projectId={projectId}
              document={document}
              onUpdated={onDocumentUpdated}
              onVersionUploaded={onDocumentUpdated}
            />
          </>
        )}
      </div>
    </div>
  );
}
