"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { DocumentPreviewDialog } from "@/components/documents/DocumentPreviewDialog";
import { UploadDropzone } from "@/components/app/UploadDropzone";
import { SectionHeader } from "@/components/app/SectionHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { Select } from "@/components/ui/select";
import { documentCategoryLabels } from "@/lib/utils/labels";
import { inferDocumentCategory } from "@/lib/storage/category-detect";
import { pollAnalysisTask } from "@/lib/documents/poll-analysis-task";
import type { DocumentAsset, DocumentCategory, ProjectWithRelations } from "@/types";
import { FileText } from "lucide-react";

interface DocumentsSectionProps {
  project: ProjectWithRelations;
}

export function DocumentsSection({ project: initialProject }: DocumentsSectionProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState(initialProject.documents ?? []);
  const [filter, setFilter] = useState<string>("all");
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory | "auto">("auto");
  const [previewDoc, setPreviewDoc] = useState<DocumentAsset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analysisNotice, setAnalysisNotice] = useState<string | null>(null);

  const handleUpload = async (files: File[]) => {
    setUploading(true);
    setAnalysisNotice(null);
    try {
      for (const file of files) {
        const category =
          uploadCategory === "auto"
            ? inferDocumentCategory(file.name, file.type)
            : uploadCategory;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("category", category);

        const res = await fetch(`/api/projects/${initialProject.id}/documents`, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) continue;

        const doc = await res.json();
        setDocuments((prev) => [
          { ...doc, createdAt: new Date(doc.createdAt), updatedAt: new Date(doc.updatedAt) },
          ...prev,
        ]);

        if (doc.autoAnalysisQueued && doc.analysisTaskId) {
          setAnalysisNotice(`正在分析 ${doc.name}…`);
          void pollAnalysisTask(initialProject.id, doc.analysisTaskId, setAnalysisNotice).then(
            (outcome) => {
              if (outcome.result === "completed") {
                setAnalysisNotice("AI 分析完成，Building Memory 已更新。");
                router.refresh();
              } else if (outcome.result === "timeout") {
                setAnalysisNotice("分析耗时较长，大文件建议拆分上传，或稍后刷新页面。");
              } else if (outcome.result === "failed") {
                setAnalysisNotice(outcome.error ?? "分析失败，请重试。");
              }
            }
          );
        } else if (doc.autoAnalysisQueued) {
          setAnalysisNotice("文档已加入分析队列。");
        }
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDeleted = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  const filtered =
    filter === "all" ? documents : documents.filter((d) => d.category === filter);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Project Documents"
        description="Upload and organize old drawings, survey photos, and project records"
      />

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs text-muted-foreground">上传类别</label>
        <Select
          value={uploadCategory}
          onChange={(e) => setUploadCategory(e.target.value as DocumentCategory | "auto")}
          className="w-52 h-8 text-xs"
        >
          <option value="auto">自动识别</option>
          {Object.entries(documentCategoryLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </Select>
      </div>

      <UploadDropzone
        onUpload={handleUpload}
        accept=".pdf,.dwg,.dxf,.jpg,.jpeg,.png,.zip"
        disabled={uploading}
      />
      {uploading && (
        <p className="text-xs text-muted-foreground">正在上传…</p>
      )}
      {analysisNotice && !uploading && (
        <p className="text-xs text-muted-foreground">{analysisNotice}</p>
      )}

      <div className="flex items-center gap-3">
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-48 h-8 text-xs">
          <option value="all">All Categories</option>
          {Object.entries(documentCategoryLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </Select>
        <span className="text-xs text-muted-foreground">{filtered.length} documents</span>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              projectId={initialProject.id}
              onPreview={setPreviewDoc}
              onAnalyzed={(updated) =>
                setDocuments((prev) =>
                  prev.map((d) => (d.id === updated.id ? { ...d, ...updated } : d))
                )
              }
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Upload old drawings, survey photos, and project records to build your document archive."
        />
      )}

      <DocumentPreviewDialog
        document={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />
    </div>
  );
}
