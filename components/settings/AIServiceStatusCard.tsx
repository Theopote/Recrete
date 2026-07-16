"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Loader2, Sparkles } from "lucide-react";

interface AIStatus {
  mode: "mock" | "openai";
  live: boolean;
  langChainEnabled: boolean;
  usage?: {
    dailyUsed: number;
    dailyLimit: number;
    monthlyUsed: number;
    monthlyLimit: number;
    remainingDaily: number;
    remainingMonthly: number;
  };
}

export function AIServiceStatusCard() {
  const [status, setStatus] = useState<AIStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/ai/status");
        if (!res.ok) throw new Error("无法加载 AI 状态");
        const data = (await res.json()) as AIStatus;
        if (!cancelled) setStatus(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "加载失败");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isLive = status?.mode === "openai" && status.live;

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-copper" />
          <h3 className="text-sm font-medium">AI 服务状态</h3>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            检测中…
          </div>
        ) : error ? (
          <p className="text-xs text-destructive">{error}</p>
        ) : status ? (
          <>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-muted-foreground">当前模式</p>
                <Badge
                  variant={isLive ? "default" : "secondary"}
                  className="mt-1 capitalize"
                >
                  {isLive ? "OpenAI 实时" : "Mock 演示"}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">API Key</p>
                <Badge variant="outline" className="mt-1">
                  {status.live ? "已配置" : "未配置"}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">LangChain</p>
                <Badge variant="outline" className="mt-1">
                  {status.langChainEnabled ? "已启用" : "未启用"}
                </Badge>
              </div>
              {status.usage && (
                <div>
                  <p className="text-muted-foreground">今日额度</p>
                  <p className="mt-1 font-medium">
                    {status.usage.dailyUsed} / {status.usage.dailyLimit}
                  </p>
                </div>
              )}
            </div>

            {isLive ? (
              <div className="flex items-start gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-xs text-foreground/80">
                  已连接 OpenAI，文档分析、诊断与方案生成将使用真实模型。
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-foreground/80 space-y-1">
                  <p>当前为 <strong>Mock 演示模式</strong>，AI 输出为预设模板，不代表真实分析质量。</p>
                  <p>
                    试用前请在环境变量中设置{" "}
                    <code className="text-[10px] bg-muted px-1 rounded">AI_SERVICE=openai</code> 和{" "}
                    <code className="text-[10px] bg-muted px-1 rounded">OPENAI_API_KEY</code>。
                  </p>
                </div>
              </div>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
