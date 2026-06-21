"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { TopBar } from "@/components/app/TopBar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Brain, AlertTriangle, FileQuestion, ListChecks, Loader2 } from "lucide-react";
import type { ProjectWithRelations } from "@/types";

const EXAMPLE_BRIEF =
  "我有一栋 1986 年建成的混凝土框架办公楼，位于西安，原本是政府办公，现在想改成社区文化中心，预算有限，希望保留主体结构。";

const LOADING_STEPS = [
  "Reading your building brief…",
  "Extracting building profile & renovation goals…",
  "Assessing risks & missing documents…",
  "Initializing Building Memory…",
  "Preparing next-step tasks…",
];

function CreateProjectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [brief, setBrief] = useState(searchParams.get("brief") ?? "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [preview, setPreview] = useState<ProjectWithRelations | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const param = searchParams.get("brief");
    if (param) setBrief(param);
  }, [searchParams]);

  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      setLoadingStep((s) => (s + 1) % LOADING_STEPS.length);
    }, 600);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleCreate = async () => {
    if (!brief.trim()) return;
    setIsGenerating(true);
    setError(null);
    setPreview(null);
    try {
      const res = await fetch("/api/projects/ai-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: brief.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create project");
        return;
      }
      setPreview(data.project);
      setTimeout(() => {
        router.push(`/projects/${data.project.id}?section=building-memory`);
      }, 2200);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

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
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      AI Creating…
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                      Create with AI
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {isGenerating && (
            <Card className="border-copper/20 bg-copper/5">
              <CardContent className="p-5 flex items-center gap-3">
                <Loader2 className="h-5 w-5 text-copper animate-spin shrink-0" />
                <div>
                  <p className="text-sm font-medium">{LOADING_STEPS[loadingStep]}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    砼憶正在理解您的建筑…
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <p className="text-xs text-destructive text-center">{error}</p>
          )}

          {preview && (
            <Card className="border-sage/30 bg-sage/5 animate-in fade-in duration-500">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-sage" />
                  <p className="text-sm font-semibold">{preview.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <PreviewItem icon={Brain} label="Building Memory" value="Initialized" />
                  <PreviewItem
                    icon={AlertTriangle}
                    label="Key Risks"
                    value={`${preview.buildingMemory?.keyRisks.length ?? 0} identified`}
                  />
                  <PreviewItem
                    icon={FileQuestion}
                    label="Missing Docs"
                    value={`${preview.buildingMemory?.missingInformation.length ?? 0} gaps`}
                  />
                  <PreviewItem
                    icon={ListChecks}
                    label="Next Tasks"
                    value={`${preview.tasks?.length ?? 0} recommended`}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Redirecting to Building Memory…
                </p>
              </CardContent>
            </Card>
          )}

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
        </div>
      </main>
    </AppShell>
  );
}

function PreviewItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2 rounded-md bg-background/60 p-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}

export default function CreateProjectPage() {
  return (
    <Suspense fallback={null}>
      <CreateProjectContent />
    </Suspense>
  );
}
