"use client";

import { useEffect, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TrialFeedbackRow {
  id: string;
  userName: string;
  userEmail: string;
  kind: string;
  step?: string | null;
  isBlocker: boolean;
  aiValueRating?: number | null;
  notes: string;
  confusingText?: string | null;
  pagePath?: string | null;
  createdAt: string;
}

export function TrialFeedbackPanel() {
  const [rows, setRows] = useState<TrialFeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/trial-feedback");
    if (!res.ok) {
      setError(res.status === 403 ? "仅管理员可查看试用反馈" : "加载失败");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setRows(data.feedback ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  if (error && rows.length === 0) {
    return null;
  }

  const blockers = rows.filter((r) => r.isBlocker).length;

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-medium">试用反馈汇总</h3>
            <p className="text-xs text-muted-foreground mt-1">
              第 5 个月试点收集的反馈。共 {rows.length} 条
              {blockers > 0 && `，${blockers} 条阻塞性问题`}。
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/api/trial-feedback?format=csv" download="trial-feedback.csv">
                <Download className="h-3.5 w-3.5 mr-1" />
                CSV
              </a>
            </Button>
          </div>
        </div>

        {loading ? (
          <p className="text-xs text-muted-foreground">加载中...</p>
        ) : rows.length === 0 ? (
          <p className="text-xs text-muted-foreground">暂无反馈。试用期间用户可通过右下角按钮提交。</p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {rows.slice(0, 20).map((row) => (
              <div key={row.id} className="rounded-md border border-border/60 p-3 text-xs space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{row.userName}</span>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {row.kind.replace("_", " ")}
                  </Badge>
                  {row.isBlocker && (
                    <Badge variant="outline" className="text-[10px] text-destructive border-destructive/40">
                      blocker
                    </Badge>
                  )}
                  {row.aiValueRating != null && (
                    <Badge variant="outline" className="text-[10px]">
                      AI {row.aiValueRating}/5
                    </Badge>
                  )}
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {new Date(row.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-muted-foreground">{row.notes}</p>
                {row.confusingText && (
                  <p className="text-[10px] text-muted-foreground">
                    文案：{row.confusingText}
                  </p>
                )}
                {row.pagePath && (
                  <p className="text-[10px] text-muted-foreground">页面：{row.pagePath}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
