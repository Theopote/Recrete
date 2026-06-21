"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatFileSize, formatDate } from "@/lib/utils";
import { documentCategoryLabels } from "@/lib/utils/labels";
import { isPdf } from "@/lib/storage/file-utils";
import type { DocumentAsset } from "@/types";
import { FileText, Image, Archive, Eye, Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentCardProps {
  document: DocumentAsset;
  projectId?: string;
  onPreview?: (document: DocumentAsset) => void;
  onAnalyzed?: (document: DocumentAsset) => void;
}

export function DocumentCard({ document, projectId, onPreview, onAnalyzed }: DocumentCardProps) {
  const [analyzing, setAnalyzing] = useState(false);
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
    try {
      const res = await fetch(
        `/api/projects/${projectId}/documents/${document.id}/analyze`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }
      );
      if (res.ok) {
        const data = await res.json();
        onAnalyzed?.(data.document);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Card
      className={cn(
        "group hover:border-copper/30 transition-colors",
        previewable && onPreview && "cursor-pointer"
      )}
      onClick={() => previewable && onPreview?.(document)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-muted p-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-medium truncate">{document.name}</h4>
              <div className="flex items-center gap-1 shrink-0">
                {document.aiSummary && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" title="AI analyzed" />
                )}
                {previewable && onPreview && (
                  <Eye className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
                )}
              </div>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                {documentCategoryLabels[document.category]}
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
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span>{formatFileSize(document.fileSize)}</span>
                <span>{formatDate(document.createdAt)}</span>
              </div>
              {projectId && (
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
                  {document.aiSummary ? "Re-analyze" : "Analyze"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
