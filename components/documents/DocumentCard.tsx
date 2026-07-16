"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatFileSize, formatDate } from "@/lib/utils";
import { documentCategoryLabels, documentCategoryLabelsZh } from "@/lib/utils/labels";
import { useLocale } from "@/lib/i18n/use-locale";
import { isPdf } from "@/lib/storage/file-utils";
import { pollAnalysisTask } from "@/lib/documents/poll-analysis-task";
import { parseAIErrorResponse } from "@/lib/ai/client-messages";
import type { DocumentAsset } from "@/types";
import { FileText, Image, Archive, Eye, Sparkles, Loader2, CheckCircle2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentCardProps {
  document: DocumentAsset;
  projectId?: string;
  onPreview?: (document: DocumentAsset) => void;
  onAnalyzed?: (document: DocumentAsset) => void;
  onDeleted?: (documentId: string) => void;
  batchMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (documentId: string) => void;
}

export function DocumentCard({
  document,
  projectId,
  onPreview,
  onAnalyzed,
  onDeleted,
  batchMode,
  selected,
  onToggleSelect,
}: DocumentCardProps) {
  const router = useRouter();
  const { label } = useLocale();
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [analyzeNotice, setAnalyzeNotice] = useState<string | null>(null);
  const Icon =
    document.mimeType.startsWith("image/") ? Image :
    document.type === "folder" ? Archive : FileText;

  const previewable =
    isPdf(document.mimeType, document.name) ||
    document.mimeType.startsWith("image/");

  const handleAnalyze = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!projectId || analyzing) return;

    setAnalyzing(true);
    setAnalyzeError(null);
    setAnalyzeNotice(null);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/documents/${document.id}/analyze`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ async: true }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const parsed = parseAIErrorResponse(data);
        setAnalyzeError(parsed.message);
        return;
      }

      if (data.analysisTaskId) {
        setAnalyzeNotice("分析中…");
        const outcome = await pollAnalysisTask(projectId, data.analysisTaskId, setAnalyzeNotice);
        if (outcome.result === "completed") {
          router.refresh();
          onAnalyzed?.({ ...document, aiSummary: document.aiSummary ?? "分析完成" });
        } else if (outcome.result === "failed") {
          setAnalyzeError(outcome.error ?? "分析失败，请重试。");
        } else {
          setAnalyzeError("分析超时。大文件建议拆分上传，或稍后刷新页面查看结果。");
        }
      } else if (data.document) {
        onAnalyzed?.(data.document);
      }
    } catch {
      setAnalyzeError("网络异常，请稍后重试。");
    } finally {
      setAnalyzing(false);
      setAnalyzeNotice(null);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!projectId || !confirm(`删除文档「${document.name}」？`)) return;

    const res = await fetch(`/api/projects/${projectId}/documents/${document.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      onDeleted?.(document.id);
    }
  };

  return (
    <Card
      className={cn(
        "group hover:border-copper/30 transition-colors",
        previewable && onPreview && !batchMode && "cursor-pointer",
        selected && "border-copper bg-copper/5"
      )}
      onClick={() => {
        if (batchMode) {
          onToggleSelect?.(document.id);
          return;
        }
        if (previewable && onPreview) onPreview(document);
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {batchMode && (
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggleSelect?.(document.id)}
              onClick={(e) => e.stopPropagation()}
              className="mt-1 h-4 w-4 rounded border-muted-foreground/40 accent-copper"
              aria-label={`Select ${document.name}`}
            />
          )}
          <div className="rounded-md bg-muted p-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-medium truncate">{document.name}</h4>
              <div className="flex items-center gap-1 shrink-0">
                {document.aiSummary && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" aria-label="AI analyzed" />
                )}
                {previewable && onPreview && (
                  <Eye className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
                )}
              </div>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                {label(
                  documentCategoryLabels,
                  documentCategoryLabelsZh,
                  document.category
                )}
              </Badge>
              <span className="text-[10px] text-muted-foreground uppercase">
                {document.type}
              </span>
            </div>
            {document.aiSummary ? (
              <p className="mt-2 text-xs text-muted-foreground line-clamp-3">
                {document.aiSummary}
              </p>
            ) : document.description ? (
              <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                {document.description}
              </p>
            ) : null}
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span>{formatFileSize(document.fileSize)}</span>
                  <span>{formatDate(document.createdAt)}</span>
                </div>
                {analyzeNotice && (
                  <p className="text-[10px] text-muted-foreground">{analyzeNotice}</p>
                )}
                {analyzeError && (
                  <p className="text-[10px] text-destructive">{analyzeError}</p>
                )}
              </div>
              {projectId && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[10px]"
                    onClick={handleAnalyze}
                    disabled={analyzing}
                  >
                    {analyzing ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3 mr-1" />
                    )}
                    {document.aiSummary ? "重新分析" : "分析"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    onClick={handleDelete}
                    disabled={batchMode}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
