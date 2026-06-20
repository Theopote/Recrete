"use client";

import ReactMarkdown from "react-markdown";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, Eye, Edit3 } from "lucide-react";
import { useState } from "react";

interface ReportEditorProps {
  content: string;
  title: string;
  onSave?: (content: string) => void;
  readOnly?: boolean;
}

export function ReportEditor({ content, title, onSave, readOnly }: ReportEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);

  const handleSave = () => {
    onSave?.(editedContent);
    setIsEditing(false);
  };

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-medium">{title}</h3>
        {!readOnly && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                  <Eye className="h-3.5 w-3.5 mr-1" /> Preview
                </Button>
                <Button variant="copper" size="sm" onClick={handleSave}>
                  <Save className="h-3.5 w-3.5 mr-1" /> Save
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit
              </Button>
            )}
          </div>
        )}
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
