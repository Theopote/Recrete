"use client";

import ReactMarkdown from "react-markdown";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, Eye, Edit3, FileDown, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { exportReportToPdf, downloadMarkdown } from "@/lib/reports/export-pdf";
import { useLocale } from "@/lib/i18n/use-locale";

interface ReportEditorProps {
  content: string;
  title: string;
  projectName?: string;
  reportId?: string;
  projectId?: string;
  onSave?: (content: string) => void;
  readOnly?: boolean;
}

export function ReportEditor({
  content,
  title,
  projectName,
  reportId,
  projectId,
  onSave,
  readOnly,
}: ReportEditorProps) {
  const { t } = useLocale();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEditedContent(content);
    setIsEditing(false);
  }, [content, title]);

  const handleSave = async () => {
    if (reportId && projectId) {
      setSaving(true);
      try {
        const res = await fetch(`/api/projects/${projectId}/reports/${reportId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: editedContent }),
        });
        if (res.ok) onSave?.(editedContent);
      } finally {
        setSaving(false);
      }
    } else {
      onSave?.(editedContent);
    }
    setIsEditing(false);
  };

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3 gap-2 flex-wrap">
        <h3 className="text-sm font-medium truncate">{title}</h3>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportReportToPdf(title, editedContent, projectName)}
          >
            <FileDown className="h-3.5 w-3.5 mr-1" /> {t("Export PDF", "导出 PDF")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadMarkdown(title, editedContent)}
          >
            <Download className="h-3.5 w-3.5 mr-1" /> .md
          </Button>
          {!readOnly && (
            isEditing ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => { setIsEditing(false); setEditedContent(content); }}>
                  <Eye className="h-3.5 w-3.5 mr-1" /> {t("Preview", "预览")}
                </Button>
                <Button variant="copper" size="sm" onClick={handleSave} disabled={saving}>
                  <Save className="h-3.5 w-3.5 mr-1" /> {saving ? t("Saving...", "保存中...") : t("Save", "保存")}
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit3 className="h-3.5 w-3.5 mr-1" /> {t("Edit", "编辑")}
              </Button>
            )
          )}
        </div>
      </div>

      <div className="p-6">
        {isEditing ? (
          <Textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="min-h-[500px] font-mono text-xs"
          />
        ) : (
          <article className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground/80 prose-strong:text-foreground prose-table:text-xs">
            <ReactMarkdown>{editedContent}</ReactMarkdown>
          </article>
        )}
      </div>
    </div>
  );
}
