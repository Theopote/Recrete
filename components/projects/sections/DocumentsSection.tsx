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
import type { DocumentAsset, ProjectWithRelations } from "@/types";
import { FileText } from "lucide-react";

interface DocumentsSectionProps {
  project: ProjectWithRelations;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollAnalysisTask(
  projectId: string,
  taskId: string,
  onUpdate: (message: string) => void
): Promise<"completed" | "failed" | "timeout"> {
  for (let attempt = 0; attempt < 45; attempt++) {
    await sleep(2000);
    const res = await fetch(`/api/projects/${projectId}/analysis-tasks/${taskId}`);
    if (!res.ok) return "failed";

    const data = (await res.json()) as {
      task?: { status: string; progress: number; message?: string; error?: string };
    };
    const task = data.task;
    if (!task) return "failed";

    onUpdate(task.message ?? `Analyzing… ${task.progress}%`);

    if (task.status === "completed") return "completed";
    if (task.status === "failed") {
      onUpdate(task.error ?? "Analysis failed");
      return "failed";
    }
  }
  return "timeout";
}

export function DocumentsSection({ project: initialProject }: DocumentsSectionProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState(initialProject.documents ?? []);
  const [filter, setFilter] = useState<string>("all");
  const [previewDoc, setPreviewDoc] = useState<DocumentAsset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analysisNotice, setAnalysisNotice] = useState<string | null>(null);

  const handleUpload = async (files: File[]) => {
    setUploading(true);
    setAnalysisNotice(null);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("category", "others");

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
          setAnalysisNotice(`Analyzing ${doc.name}…`);
          void pollAnalysisTask(initialProject.id, doc.analysisTaskId, setAnalysisNotice).then(
            (result) => {
              if (result === "completed") {
                setAnalysisNotice("AI analysis complete. Building Memory updated.");
                router.refresh();
              } else if (result === "timeout") {
                setAnalysisNotice("Analysis is taking longer than expected. Refresh later to see results.");
              }
            }
          );
        } else if (doc.autoAnalysisQueued) {
          setAnalysisNotice("AI analysis queued for uploaded files.");
        }
      }
    } finally {
      setUploading(false);
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

      <UploadDropzone
        onUpload={handleUpload}
        accept=".pdf,.dwg,.jpg,.jpeg,.png,.zip"
        disabled={uploading}
      />
      {uploading && (
        <p className="text-xs text-muted-foreground">Uploading files...</p>
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
