import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatFileSize, formatDate } from "@/lib/utils";
import { documentCategoryLabels } from "@/lib/utils/labels";
import type { DocumentAsset } from "@/types";
import { FileText, Image, Archive } from "lucide-react";

interface DocumentCardProps {
  document: DocumentAsset;
}

export function DocumentCard({ document }: DocumentCardProps) {
  const Icon =
    document.mimeType.startsWith("image/") ? Image :
    document.type === "folder" ? Archive : FileText;

  return (
    <Card className="group hover:border-copper/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-muted p-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium truncate">{document.name}</h4>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                {documentCategoryLabels[document.category]}
              </Badge>
              <span className="text-[10px] text-muted-foreground uppercase">
                {document.type}
              </span>
            </div>
            {document.description && (
              <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                {document.description}
              </p>
            )}
            <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
              <span>{formatFileSize(document.fileSize)}</span>
              <span>{formatDate(document.createdAt)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
