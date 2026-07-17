"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Globe } from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import type { WebCaseResult } from "@/lib/ai/knowledge/similar-cases";

interface WebCaseCardProps {
  item: WebCaseResult;
  compact?: boolean;
}

export function WebCaseCard({ item, compact }: WebCaseCardProps) {
  const { t } = useLocale();

  return (
    <Card className="border border-sky-200/70 bg-sky-50/30">
      <CardContent className={compact ? "p-3" : "p-4"}>
        <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className="text-[10px] border-sky-300/60 text-sky-800 bg-sky-100/50">
                <Globe className="mr-1 h-3 w-3" />
                {t("Web Reference", "联网参考")}
              </Badge>
              {item.source && (
                <span className="text-[10px] text-muted-foreground truncate">{item.source}</span>
              )}
            </div>
            <h4 className="text-sm font-semibold leading-tight">{item.title}</h4>
            {item.publishedDate && (
              <p className="text-[10px] text-muted-foreground mt-0.5">{item.publishedDate}</p>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{item.snippet}</p>

        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-[11px] text-sky-700 hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            {t("View source", "查看来源")}
          </a>
        )}
      </CardContent>
    </Card>
  );
}

interface DataSourceNoteProps {
  note: string;
  className?: string;
}

export function WebEvidenceNote({ text }: { text: string }) {
  const { t } = useLocale();
  const hasWeb = text.includes("联网检索") || text.toLowerCase().includes("web reference");

  if (!hasWeb) {
    return <p className="text-xs">{text}</p>;
  }

  const segments = text.split(" · ");

  return (
    <div className="space-y-1">
      {segments.map((segment) => {
        const isWeb = segment.includes("联网检索");
        return (
          <p
            key={segment}
            className={`text-xs ${isWeb ? "rounded border border-sky-200 bg-sky-50/80 px-2 py-1 text-sky-900" : ""}`}
          >
            {isWeb && (
              <Badge variant="outline" className="mr-1.5 text-[9px] border-sky-300 text-sky-700">
                <Globe className="mr-1 h-2.5 w-2.5" />
                {t("Web", "联网")}
              </Badge>
            )}
            {segment}
          </p>
        );
      })}
      <p className="text-[10px] text-muted-foreground">
        {t("Verify against official published standards.", "请以官方发布文本为准核实。")}
      </p>
    </div>
  );
}

export function DataSourceNote({ note, className }: DataSourceNoteProps) {
  const { t } = useLocale();
  const hasWebReference =
    note.includes("market web reference") ||
    note.includes("联网造价参考") ||
    note.includes("联网检索");

  if (!hasWebReference) {
    return <p className={className}>{note}</p>;
  }

  const parts = note.split(" · ");

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-1.5">
        {parts.map((part) => {
          const isWeb =
            part.startsWith("market web reference") || part.includes("联网造价参考");
          return (
            <span
              key={part}
              className={
                isWeb
                  ? "inline-flex items-center gap-1 rounded border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[10px] text-sky-800"
                  : "text-[10px] text-muted-foreground"
              }
            >
              {isWeb && <Globe className="h-3 w-3 shrink-0" />}
              {isWeb
                ? part.replace(/^market web reference:\s*/, "")
                : part}
            </span>
          );
        })}
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">
        {t(
          "Web references are indicative — verify with official sources or local QS.",
          "联网参考仅供参考，请以官方文本或当地造价咨询为准。"
        )}
      </p>
    </div>
  );
}
