"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { TopBar } from "@/components/app/TopBar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { AIErrorBanner } from "@/components/ai/AIErrorBanner";
import { Sparkles, Loader2 } from "lucide-react";
import {
  AICreateStreamPanel,
  applyStreamEvent,
  consumeProjectCreateStream,
  INITIAL_STREAM_STATE,
  type StreamState,
} from "@/components/projects/AICreateStreamPanel";
import { usePermissions } from "@/hooks/use-permissions";

const EXAMPLE_BRIEF =
  "我有一栋 1986 年建成的混凝土框架办公楼，位于西安，原本是政府办公，现在想改成社区文化中心，预算有限，希望保留主体结构。";

function CreateProjectContent() {
  const router = useRouter();
  const { can, isLoading } = usePermissions();
  const searchParams = useSearchParams();
  const [brief, setBrief] = useState(searchParams.get("brief") ?? "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamState, setStreamState] = useState<StreamState>(INITIAL_STREAM_STATE);
  const [autoStarted, setAutoStarted] = useState(false);
  const [createError, setCreateError] = useState<{ message: string; retryable: boolean } | null>(null);

  const startCreate = useCallback(async (text: string) => {
    setIsGenerating(true);
    setCreateError(null);
    setStreamState(INITIAL_STREAM_STATE);

    try {
      await consumeProjectCreateStream(text, (event) => {
        setStreamState((prev) => {
          const next = applyStreamEvent(prev, event);
          if (event.type === "error") {
            setCreateError({ message: event.message, retryable: true });
          }
          return next;
        });
      });
    } catch {
      setCreateError({ message: "创建失败，请稍后重试。", retryable: true });
    } finally {
      setIsGenerating(false);
    }
  }, []);

  useEffect(() => {
    const param = searchParams.get("brief");
    if (param) setBrief(param);
  }, [searchParams]);

  useEffect(() => {
    if (autoStarted || isGenerating) return;
    const param = searchParams.get("brief");
    if (param && param.trim().length >= 20) {
      setAutoStarted(true);
      void startCreate(param.trim());
    }
  }, [searchParams, autoStarted, isGenerating, startCreate]);

  useEffect(() => {
    if (!streamState.isComplete || !streamState.project) return;
    const timer = setTimeout(() => {
      router.push(
        `/projects/${streamState.project!.id}?section=strategies&welcome=1`
      );
    }, 2400);
    return () => clearTimeout(timer);
  }, [streamState.isComplete, streamState.project, router]);

  const handleCreate = async () => {
    if (!brief.trim()) return;
    await startCreate(brief.trim());
  };

  const showStream = isGenerating || streamState.items.length > 0 || streamState.error;

  if (!isLoading && !can("edit_profile")) {
    return (
      <AppShell>
        <TopBar title="AI Create Project" subtitle="Access restricted" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-lg rounded-lg border border-dashed p-8 text-center space-y-3">
            <p className="text-sm font-medium">Project creation not available</p>
            <p className="text-xs text-muted-foreground">
              Your account role does not include permission to create projects. Contact a project manager.
            </p>
            <Button variant="outline" size="sm" onClick={() => router.push("/projects")}>
              Back to Projects
            </Button>
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <TopBar
        title="AI Create Project"
        subtitle="面向既有建筑更新的 AI 设计助手 · AI Copilot for Existing Building Renovation"
      />
      <main className="flex-1 overflow-y-auto p-6 bg-grid-pattern bg-grid">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="text-center space-y-2 pb-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-copper/30 bg-copper/5 px-3 py-1 text-[10px] font-medium text-copper">
              <Sparkles className="h-3 w-3" />
              Recrete / 砼憶 — AI Building Renovation Agent
            </div>
            <h2 className="text-lg font-semibold tracking-tight">
              Describe your building in one sentence
            </h2>
            <p className="text-xs text-muted-foreground max-w-lg mx-auto leading-relaxed">
              会阅读、理解、诊断、想象和管理老旧建筑改造项目的 AI 建筑更新智能体。
              No forms — AI generates your project profile, Building Memory, risks, and next steps.
            </p>
          </div>

          {!showStream && (
            <Card className="border-2 border-copper/25 shadow-sm">
              <CardContent className="p-5 space-y-4">
                <Textarea
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder={EXAMPLE_BRIEF}
                  className="min-h-[120px] resize-none text-sm leading-relaxed border-0 bg-muted/40 focus-visible:ring-copper/30"
                  disabled={isGenerating}
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setBrief(EXAMPLE_BRIEF)}
                    className="text-[10px] text-muted-foreground hover:text-copper underline-offset-2 hover:underline"
                  >
                    Use example brief
                  </button>
                  <Button
                    variant="copper"
                    onClick={handleCreate}
                    disabled={isGenerating || brief.trim().length < 20}
                  >
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    Create with AI
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {createError && (
            <AIErrorBanner
              message={createError.message}
              retryable={createError.retryable}
              onRetry={() => brief.trim().length >= 20 && void startCreate(brief.trim())}
              onDismiss={() => setCreateError(null)}
            />
          )}

          {showStream && <AICreateStreamPanel state={streamState} />}

          {!showStream && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {[
                { title: "AI 创建项目", desc: "One sentence → full project workspace" },
                { title: "AI 建筑记忆", desc: "Persistent building intelligence" },
                { title: "AI 策略实验室", desc: "Three strategies, one click" },
              ].map((item) => (
                <div key={item.title} className="rounded-lg border bg-card/60 p-3 text-center">
                  <p className="text-xs font-medium">{item.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          )}

          {showStream && isGenerating && (
            <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" />
              Streaming AI output — please wait
            </p>
          )}
        </div>
      </main>
    </AppShell>
  );
}

export default function CreateProjectPage() {
  return (
    <Suspense fallback={null}>
      <CreateProjectContent />
    </Suspense>
  );
}
