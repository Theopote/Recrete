"use client";

import { useCallback, useState } from "react";
import { UploadDropzone } from "@/components/app/UploadDropzone";
import { Button } from "@/components/ui/button";
import { BIM_ACCEPT } from "@/lib/bim/formats";
import type { BimModel } from "@/types/bim";
import { Loader2, Upload } from "lucide-react";

interface BimModelUploadProps {
  projectId: string;
  onUploaded: (model: BimModel) => void;
}

export function BimModelUpload({ projectId, onUploaded }: BimModelUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "Upload failed");
        }
        onUploaded({
          ...data,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [projectId, onUploaded]
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
          Uploading and processing model…
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      <p className="text-[10px] text-muted-foreground">
        Supported: IFC (GLB lightweight + room areas), DWG, DXF (SVG preview + room areas). Revit (.rvt) — export to IFC first.
      </p>
    </div>
  );
}

interface BimModelUploadButtonProps {
  projectId: string;
  onUploaded: (model: BimModel) => void;
}

export function BimModelUploadButton({ projectId, onUploaded }: BimModelUploadButtonProps) {
  const [uploading, setUploading] = useState(false);

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
      const data = await res.json();
      if (res.ok) {
        onUploaded({
          ...data,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        });
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
          Upload Model
        </span>
      </Button>
    </label>
  );
}
