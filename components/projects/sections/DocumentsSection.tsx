"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { DocumentPreviewDialog } from "@/components/documents/DocumentPreviewDialog";
import { UploadDropzone } from "@/components/app/UploadDropzone";
import { SectionHeader } from "@/components/app/SectionHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  documentCategoryLabels,
  documentCategoryLabelsZh,
  documentProjectPhaseLabels,
  documentProjectPhaseLabelsZh,
} from "@/lib/utils/labels";
import { pollAnalysisTask } from "@/lib/documents/poll-analysis-task";
import { parseIngestCompletionMessage } from "@/lib/documents/ingest-diagnosis-bridge";
import { openBuildingConditionAfterIngest } from "@/lib/building-condition/client-navigation";
import { useLocale } from "@/lib/i18n/use-locale";
import type { DocumentAsset, DocumentCategory, DocumentProjectPhase, ProjectWithRelations } from "@/types";
import { defaultPhaseForProjectStatus } from "@/lib/documents/governance";
import { FileText, Trash2, Tags, Stethoscope } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface DocumentsSectionProps {
  project: ProjectWithRelations;
}

export function DocumentsSection({ project: initialProject }: DocumentsSectionProps) {
  const router = useRouter();
  const { t, label } = useLocale();
  const [documents, setDocuments] = useState(initialProject.documents ?? []);
  const [filter, setFilter] = useState<string>("all");
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory | "auto">("auto");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadTags, setUploadTags] = useState("");
  const [uploadPhase, setUploadPhase] = useState<DocumentProjectPhase>(
    defaultPhaseForProjectStatus(initialProject.status)
  );
  const [previewDoc, setPreviewDoc] = useState<DocumentAsset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analysisNotice, setAnalysisNotice] = useState<string | null>(null);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkCategory, setBulkCategory] = useState<DocumentCategory>("others");
  const [bulkCategorizing, setBulkCategorizing] = useState(false);
  const [diagnosisPrompt, setDiagnosisPrompt] = useState<{
    evidenceCount: number;
  } | null>(null);

  const handleUpload = async (files: File[]) => {
    setUploading(true);
    setAnalysisNotice(null);
    try {
      for (const file of files) {
        const category =
          uploadCategory === "auto"
            ? "auto"
            : uploadCategory;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("category", category);
        if (uploadDescription.trim()) formData.append("description", uploadDescription.trim());
        if (uploadTags.trim()) formData.append("tags", uploadTags.trim());
        formData.append("projectPhase", uploadPhase);

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
          setAnalysisNotice(
            t(`Analyzing ${doc.name}…`, `正在分析 ${doc.name}…`)
          );
          void pollAnalysisTask(initialProject.id, doc.analysisTaskId, setAnalysisNotice).then(
            async (outcome) => {
              if (outcome.result === "completed") {
                if (doc.openBuildingCondition) {
                  setAnalysisNotice(
                    t("Analysis complete. Opening Building Condition…", "分析完成，正在打开建筑现状…")
                  );
                  await openBuildingConditionAfterIngest({
                    projectId: initialProject.id,
                    bimModelId: doc.bimModelId,
                    onUpdate: setAnalysisNotice,
                  });
                  return;
                }
                setAnalysisNotice(
                  t(
                    "AI analysis complete. Building Memory updated.",
                    "AI 分析完成，Building Memory 已更新。"
                  )
                );
                const meta = parseIngestCompletionMessage(outcome.message);
                if (meta.suggestDiagnosis) {
                  setDiagnosisPrompt({ evidenceCount: meta.evidenceCount });
                }
                router.refresh();
              } else if (outcome.result === "timeout") {
                setAnalysisNotice(
                  t(
                    "Analysis is taking longer. Split large files or refresh later.",
                    "分析耗时较长，大文件建议拆分上传，或稍后刷新页面。"
                  )
                );
              } else if (outcome.result === "failed") {
                setAnalysisNotice(outcome.error ?? t("Analysis failed.", "分析失败，请重试。"));
              }
            }
          );
        } else if (doc.autoAnalysisQueued) {
          setAnalysisNotice(
            t("Document queued for analysis.", "文档已加入分析队列。")
          );
        }
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDeleted = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(docId);
      return next;
    });
  };

  const toggleSelect = (docId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId);
      else next.add(docId);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const confirmMsg = t(
      `Delete ${selectedIds.size} selected document(s)?`,
      `删除已选的 ${selectedIds.size} 个文档？`
    );
    if (!confirm(confirmMsg)) return;

    setBulkDeleting(true);
    try {
      const ids = [...selectedIds];
      for (const docId of ids) {
        const res = await fetch(
          `/api/projects/${initialProject.id}/documents/${docId}`,
          { method: "DELETE" }
        );
        if (res.ok) handleDeleted(docId);
      }
      setBatchMode(false);
      setSelectedIds(new Set());
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleBulkCategorize = async () => {
    if (selectedIds.size === 0) return;
    setBulkCategorizing(true);
    try {
      const ids = [...selectedIds];
      for (const docId of ids) {
        const res = await fetch(
          `/api/projects/${initialProject.id}/documents/${docId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category: bulkCategory }),
          }
        );
        if (res.ok) {
          const updated = await res.json();
          setDocuments((prev) =>
            prev.map((d) =>
              d.id === docId
                ? {
                    ...d,
                    category: updated.category,
                    updatedAt: new Date(updated.updatedAt),
                  }
                : d
            )
          );
        }
      }
      setBatchMode(false);
      setSelectedIds(new Set());
    } finally {
      setBulkCategorizing(false);
    }
  };

  const filtered =
    filter === "all" ? documents : documents.filter((d) => d.category === filter);

  const toggleBatchMode = () => {
    setBatchMode((prev) => {
      if (prev) setSelectedIds(new Set());
      return !prev;
    });
  };

  const selectAllFiltered = () => {
    setSelectedIds(new Set(filtered.map((d) => d.id)));
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Project Documents"
        titleZh="项目文档"
        description="Upload and organize old drawings, survey photos, and project records"
        descriptionZh="上传并管理旧图纸、勘察照片与项目资料"
      />

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs text-muted-foreground">
          {t("Upload category", "上传类别")}
        </label>
        <Select
          value={uploadCategory}
          onChange={(e) => setUploadCategory(e.target.value as DocumentCategory | "auto")}
          className="w-52 h-8 text-xs"
        >
          <option value="auto">
            {t("Auto detect", "自动识别")}
          </option>
          {Object.keys(documentCategoryLabels).map((key) => (
            <option key={key} value={key}>
              {label(
                documentCategoryLabels,
                documentCategoryLabelsZh,
                key as keyof typeof documentCategoryLabels
              )}
            </option>
          ))}
        </Select>
        <label className="text-xs text-muted-foreground">
          {t("Project phase", "项目阶段")}
        </label>
        <Select
          value={uploadPhase}
          onChange={(e) => setUploadPhase(e.target.value as DocumentProjectPhase)}
          className="w-52 h-8 text-xs"
        >
          {Object.keys(documentProjectPhaseLabels).map((key) => (
            <option key={key} value={key}>
              {label(
                documentProjectPhaseLabels,
                documentProjectPhaseLabelsZh,
                key as DocumentProjectPhase
              )}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">{t("Description", "描述")}</label>
          <input
            value={uploadDescription}
            onChange={(e) => setUploadDescription(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-xs"
            placeholder={t("Optional note for this upload", "可选：说明本次上传内容")}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">{t("Tags", "标签")}</label>
          <input
            value={uploadTags}
            onChange={(e) => setUploadTags(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-xs"
            placeholder={t("fire, heritage, 1986", "防火, 文保, 1986")}
          />
        </div>
      </div>

      <UploadDropzone
        onUpload={handleUpload}
        accept=".pdf,.dwg,.dxf,.jpg,.jpeg,.png,.zip,.tif,.tiff"
        disabled={uploading}
      />
      {uploading && (
        <p className="text-xs text-muted-foreground">
          {t("Uploading…", "正在上传…")}
        </p>
      )}
      {analysisNotice && !uploading && (
        <p className="text-xs text-muted-foreground">{analysisNotice}</p>
      )}

      {diagnosisPrompt && (
        <Card className="border-copper/30 bg-copper/5">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-2">
              <Stethoscope className="h-4 w-4 text-copper shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium">
                  {t("New document evidence ready for diagnosis", "新文档证据可用于诊断")}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {t(
                    `${diagnosisPrompt.evidenceCount} evidence item(s) extracted — refresh diagnosis to link findings.`,
                    `已抽取 ${diagnosisPrompt.evidenceCount} 条证据 — 建议更新诊断以关联发现。`
                  )}
                </p>
              </div>
            </div>
            <Button
              variant="copper"
              size="sm"
              className="shrink-0"
              onClick={() =>
                router.push(`/projects/${initialProject.id}?section=diagnosis`)
              }
            >
              {t("Open Diagnosis", "打开诊断")}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-48 h-8 text-xs">
          <option value="all">
            {t("All Categories", "全部分类")}
          </option>
          {Object.keys(documentCategoryLabels).map((key) => (
            <option key={key} value={key}>
              {label(
                documentCategoryLabels,
                documentCategoryLabelsZh,
                key as keyof typeof documentCategoryLabels
              )}
            </option>
          ))}
        </Select>
        <span className="text-xs text-muted-foreground">
          {filtered.length} {t("documents", "个文档")}
        </span>
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={toggleBatchMode}>
          {batchMode
            ? t("Cancel selection", "取消选择")
            : t("Batch select", "批量选择")}
        </Button>
        {batchMode && filtered.length > 0 && (
          <>
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={selectAllFiltered}>
              {t("Select all", "全选")}
            </Button>
            <Select
              value={bulkCategory}
              onChange={(e) => setBulkCategory(e.target.value as DocumentCategory)}
              className="w-40 h-8 text-xs"
            >
              {Object.keys(documentCategoryLabels).map((key) => (
                <option key={key} value={key}>
                  {label(
                    documentCategoryLabels,
                    documentCategoryLabelsZh,
                    key as keyof typeof documentCategoryLabels
                  )}
                </option>
              ))}
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={handleBulkCategorize}
              disabled={selectedIds.size === 0 || bulkCategorizing}
            >
              <Tags className="h-3 w-3 mr-1" />
              {bulkCategorizing
                ? t("Updating…", "更新中…")
                : t("Set category", "设置分类")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-8 text-xs"
              onClick={handleBulkDelete}
              disabled={selectedIds.size === 0 || bulkDeleting}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              {bulkDeleting
                ? t("Deleting…", "删除中…")
                : t(`Delete (${selectedIds.size})`, `删除 (${selectedIds.size})`)}
            </Button>
          </>
        )}
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
              batchMode={batchMode}
              selected={selectedIds.has(doc.id)}
              onToggleSelect={toggleSelect}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title={t("No documents yet", "暂无文档")}
          description={t(
            "Upload old drawings, survey photos, and project records to build your document archive.",
            "上传旧图纸、勘察照片与项目资料，建立文档归档。"
          )}
        />
      )}

      <DocumentPreviewDialog
        document={previewDoc}
        projectId={initialProject.id}
        onClose={() => setPreviewDoc(null)}
        onDocumentUpdated={(updated) => {
          setDocuments((prev) =>
            prev.map((d) => (d.id === updated.id ? { ...d, ...updated } : d))
          );
          setPreviewDoc(updated);
        }}
      />
    </div>
  );
}
