"use client";

import ReactMarkdown from "react-markdown";

interface ReportMarkdownPreviewProps {
  content: string;
}

export function ReportMarkdownPreview({ content }: ReportMarkdownPreviewProps) {
  return (
    <article className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground/80 prose-strong:text-foreground prose-table:text-xs">
      <ReactMarkdown>{content}</ReactMarkdown>
    </article>
  );
}
