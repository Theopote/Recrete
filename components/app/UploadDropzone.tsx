"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { Upload, FileUp } from "lucide-react";

interface UploadDropzoneProps {
  onUpload: (files: File[]) => void;
  accept?: string;
  className?: string;
  disabled?: boolean;
}

export function UploadDropzone({ onUpload, accept, className, disabled }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length) onUpload(files);
    },
    [onUpload]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) onUpload(files);
  };

  return (
    <label
      onDragOver={(e) => { if (!disabled) { e.preventDefault(); setIsDragging(true); } }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 transition-colors",
        disabled && "opacity-50 cursor-not-allowed",
        isDragging ? "border-copper bg-copper/5" : "border-border hover:border-copper/40 hover:bg-muted/30",
        className
      )}
    >
      <input type="file" className="hidden" multiple accept={accept} onChange={handleChange} disabled={disabled} />
      <div className="mb-3 rounded-full bg-muted p-3">
        {isDragging ? (
          <FileUp className="h-5 w-5 text-copper" />
        ) : (
          <Upload className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <p className="text-sm font-medium">Drop files here or click to upload</p>
      <p className="mt-1 text-xs text-muted-foreground">
        PDF, DWG, images, and archives supported
      </p>
    </label>
  );
}
