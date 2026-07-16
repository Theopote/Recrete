"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Search, FolderKanban, FileText, Stethoscope, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/i18n/use-locale";
import type { SearchResult } from "@/types";

const typeIcons = {
  project: FolderKanban,
  document: FileText,
  diagnosis: Stethoscope,
  issue: AlertTriangle,
};

export function GlobalSearch() {
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results ?? []);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative hidden md:block">
      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground z-10" />
      <Input
        placeholder={t("Search projects, documents...", "搜索项目、文档…")}
        className="h-8 w-64 pl-8 text-xs"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
      />
      {open && query.length >= 2 && (
        <div className="absolute top-full mt-1 w-80 rounded-md border bg-card shadow-lg z-50 overflow-hidden">
          {loading ? (
            <p className="px-3 py-4 text-xs text-muted-foreground">
              {t("Searching...", "搜索中…")}
            </p>
          ) : results.length > 0 ? (
            <ul>
              {results.map((r) => {
                const Icon = typeIcons[r.type];
                return (
                  <li key={`${r.type}-${r.id}`}>
                    <Link
                      href={r.href}
                      onClick={() => {
                        setOpen(false);
                        setQuery("");
                      }}
                      className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-muted transition-colors"
                    >
                      <Icon className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{r.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{r.subtitle}</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-3 py-4 text-xs text-muted-foreground">
              {t(`No results for "${query}"`, `未找到「${query}」相关结果`)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
