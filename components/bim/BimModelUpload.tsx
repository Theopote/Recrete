"use client";

import { useCallback, useState } from "react";
import { UploadDropzone } from "@/components/app/UploadDropzone";
import { Button } from "@/components/ui/button";
import { BIM_ACCEPT } from "@/lib/bim/formats";
import type { BimModel } from "@/types/bim";
import { Loader2, Upload } from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { openBuildingConditionAfterIngest } from "@/lib/building-condition/client-navigation";

export type BimModelUploadResponse = BimModel & {
  documentId?: string;
  analysisTaskId?: string;
  openBuildingCondition?: boolean;
};

interface BimModelUploadProps {
  projectId: string;
  onUploaded: (model: BimModelUploadResponse) => void;
}

export function BimModelUpload({ projectId, onUploaded }: BimModelUploadProps) {
  const { t } = useLocale();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirectNotice, setRedirectNotice] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`/api/projects/${projectId}/bim-models`, {
          method: "POST",
          body: formData,
        });
        const data = (await res.json()) as BimModelUploadResponse & { error?: string };
        if (!res.ok) {
          throw new Error(data.error ?? t("Upload failed", "上传失败"));
        }
        const model: BimModelUploadResponse = {
          ...data,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        };
        onUploaded(model);

        if (model.openBuildingCondition) {
          setRedirectNotice(t("Analyzing CAD drawing…", "正在分析 CAD 图纸…"));
          void openBuildingConditionAfterIngest({
            projectId,
            analysisTaskId: model.analysisTaskId,
            bimModelId: model.id,
            onUpdate: setRedirectNotice,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t("Upload failed", "上传失败"));
      } finally {
        setUploading(false);
      }
    },
    [projectId, onUploaded, t]
  );

  const handleUpload = async (files: File[]) => {
    for (const file of files) {
      await uploadFile(file);
    }
  };

  return (
    <div className="space-y-2">
      <UploadDropzone
        onUpload={handleUpload}
        accept={BIM_ACCEPT}
        disabled={uploading}
      />
      {uploading && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {t("Uploading and processing model…", "正在上传并处理模型…")}
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {redirectNotice && (
        <p className="text-xs text-muted-foreground">{redirectNotice}</p>
      )}
      <p className="text-[10px] text-muted-foreground">
        {t(
          "Supported: IFC (GLB lightweight + room areas), DWG, DXF (SVG preview + room areas). Revit (.rvt) — export to IFC first.",
          "支持：IFC（GLB 轻量预览 + 房间面积）、DWG、DXF（SVG 预览 + 房间面积）。Revit (.rvt) 请先导出为 IFC。"
        )}
      </p>
    </div>
  );
}

interface BimModelUploadButtonProps {
  projectId: string;
  onUploaded: (model: BimModelUploadResponse) => void;
}

export function BimModelUploadButton({ projectId, onUploaded }: BimModelUploadButtonProps) {
  const { t } = useLocale();
  const [uploading, setUploading] = useState(false);
  const [redirectNotice, setRedirectNotice] = useState<string | null>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/projects/${projectId}/bim-models`, {
        method: "POST",
        body: formData,
      });
      const data = (await res.json()) as BimModelUploadResponse;
      if (res.ok) {
        const model: BimModelUploadResponse = {
          ...data,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        };
        onUploaded(model);
        if (model.openBuildingCondition) {
          setRedirectNotice(t("Opening Building Condition…", "正在打开建筑现状…"));
          void openBuildingConditionAfterIngest({
            projectId,
            analysisTaskId: model.analysisTaskId,
            bimModelId: model.id,
            onUpdate: setRedirectNotice,
          });
        }
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <label>
      <input
        type="file"
        accept={BIM_ACCEPT}
        className="hidden"
        onChange={handleChange}
        disabled={uploading}
      />
      <Button variant="outline" size="sm" asChild disabled={uploading}>
        <span className="cursor-pointer">
          {uploading ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="mr-1.5 h-3.5 w-3.5" />
          )}
          {t("Upload Model", "上传模型")}
        </span>
      </Button>
      {redirectNotice && (
        <span className="sr-only">{redirectNotice}</span>
      )}
    </label>
  );
}
