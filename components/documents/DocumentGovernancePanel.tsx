"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  documentCategoryLabels,
  documentCategoryLabelsZh,
  documentProjectPhaseLabels,
  documentProjectPhaseLabelsZh,
} from "@/lib/utils/labels";
import { useLocale } from "@/lib/i18n/use-locale";
import type { DocumentAsset, DocumentCategory, DocumentProjectPhase } from "@/types";
import { Loader2, Save, Upload } from "lucide-react";

interface DocumentGovernancePanelProps {
  projectId: string;
  document: DocumentAsset;
  onUpdated?: (document: DocumentAsset) => void;
  onVersionUploaded?: (document: DocumentAsset) => void;
}

export function DocumentGovernancePanel({
  projectId,
  document,
  onUpdated,
  onVersionUploaded,
}: DocumentGovernancePanelProps) {
  const { t, label } = useLocale();
  const [description, setDescription] = useState(document.description ?? "");
  const [tagsInput, setTagsInput] = useState((document.tags ?? []).join(", "));
  const [category, setCategory] = useState<DocumentCategory>(document.category);
  const [projectPhase, setProjectPhase] = useState<DocumentProjectPhase>(
    document.projectPhase ?? "general"
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [versions, setVersions] = useState<DocumentAsset[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const versionInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDescription(document.description ?? "");
    setTagsInput((document.tags ?? []).join(", "));
    setCategory(document.category);
    setProjectPhase(document.projectPhase ?? "general");
  }, [document]);

  useEffect(() => {
    void fetch(`/api/projects/${projectId}/documents/${document.id}/versions`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.versions)) setVersions(data.versions);
      })
      .catch(() => undefined);
  }, [projectId, document.id]);

  const handleSaveMetadata = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/documents/${document.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim() || null,
          tags: tagsInput,
          category,
          projectPhase,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onUpdated?.(data);
        setNotice(t("Metadata saved", "元数据已保存"));
      } else {
        setNotice(data.message ?? t("Save failed", "保存失败"));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUploadVersion = async (file: File) => {
    setUploading(true);
    setNotice(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("description", description.trim());
      formData.append("tags", tagsInput);
      formData.append("category", category);
      formData.append("projectPhase", projectPhase);

      const res = await fetch(
        `/api/projects/${projectId}/documents/${document.id}/versions`,
        { method: "POST", body: formData }
      );
      const data = await res.json();
      if (res.ok) {
        onVersionUploaded?.(data);
        setVersions((prev) => [data, ...prev.filter((v) => v.id !== data.id)]);
        setNotice(t("New version uploaded", "新版本已上传"));
      } else {
        setNotice(data.message ?? t("Upload failed", "上传失败"));
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border-t bg-muted/20 p-4 space-y-4 max-h-[40vh] overflow-y-auto">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-[10px]">
          {label(documentCategoryLabels, documentCategoryLabelsZh, document.category)}
        </Badge>
        <Badge variant="secondary" className="text-[10px]">
          {label(documentProjectPhaseLabels, documentProjectPhaseLabelsZh, document.projectPhase ?? "general")}
        </Badge>
        <Badge variant="secondary" className="text-[10px]">
          v{document.versionNumber ?? 1}
          {document.isCurrentVersion === false
            ? t(" (archived)", "（历史）")
            : t(" (current)", "（当前）")}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("Category", "分类")}
          </label>
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value as DocumentCategory)}
            className="h-8 text-xs w-full"
          >
            {Object.keys(documentCategoryLabels).map((key) => (
              <option key={key} value={key}>
                {label(
                  documentCategoryLabels,
                  documentCategoryLabelsZh,
                  key as DocumentCategory
                )}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("Project phase", "项目阶段")}
          </label>
          <Select
            value={projectPhase}
            onChange={(e) => setProjectPhase(e.target.value as DocumentProjectPhase)}
            className="h-8 text-xs w-full"
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
      </div>

      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {t("Description", "描述")}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full rounded-md border bg-background px-3 py-2 text-xs"
          placeholder={t("What this document contains…", "说明文档内容…")}
        />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {t("Tags", "标签")}
        </label>
        <input
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-xs"
          placeholder={t("fire, structure, 1986…", "防火, 结构, 1986…")}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={handleSaveMetadata} disabled={saving}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
          {t("Save metadata", "保存元数据")}
        </Button>
        <Button
          variant="copper"
          size="sm"
          disabled={uploading}
          onClick={() => versionInputRef.current?.click()}
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
          {t("Upload new version", "上传新版本")}
        </Button>
        <input
          ref={versionInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleUploadVersion(file);
            e.target.value = "";
          }}
        />
      </div>

      {versions.length > 1 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("Version history", "版本历史")}
          </p>
          <ul className="space-y-1">
            {versions.map((version) => (
              <li
                key={version.id}
                className="text-xs flex items-center justify-between gap-2 rounded border px-2 py-1.5"
              >
                <span className="truncate">
                  v{version.versionNumber ?? 1} · {version.name}
                </span>
                {version.isCurrentVersion !== false && (
                  <Badge className="text-[9px] shrink-0">{t("Current", "当前")}</Badge>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {notice && <p className="text-xs text-muted-foreground">{notice}</p>}
    </div>
  );
}
