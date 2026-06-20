"use client";

import { useState } from "react";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { UploadDropzone } from "@/components/app/UploadDropzone";
import { SectionHeader } from "@/components/app/SectionHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { Select } from "@/components/ui/select";
import { documentCategoryLabels } from "@/lib/utils/labels";
import type { DocumentAsset, DocumentCategory, ProjectWithRelations } from "@/types";
import { FileText } from "lucide-react";

interface DocumentsSectionProps {
  project: ProjectWithRelations;
}

export function DocumentsSection({ project: initialProject }: DocumentsSectionProps) {
  const [documents, setDocuments] = useState(initialProject.documents ?? []);
  const [filter, setFilter] = useState<string>("all");

  const handleUpload = async (files: File[]) => {
    for (const file of files) {
      const res = await fetch(`/api/projects/${initialProject.id}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          category: "others",
          fileSize: file.size,
          mimeType: file.type || "application/octet-stream",
        }),
      });
      if (res.ok) {
        const doc = await res.json();
        setDocuments((prev) => [doc, ...prev]);
      }
    }
  };

  const filtered =
    filter === "all" ? documents : documents.filter((d) => d.category === filter);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Project Documents"
        description="Upload and organize old drawings, survey photos, and project records"
      />

      <UploadDropzone onUpload={handleUpload} accept=".pdf,.dwg,.jpg,.jpeg,.png,.zip" />

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
            <DocumentCard key={doc.id} document={doc} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Upload old drawings, survey photos, and project records to build your document archive."
        />
      )}
    </div>
  );
}
