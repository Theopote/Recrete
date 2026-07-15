"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { MessageCirclePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import type { TrialFeedbackInput } from "@/lib/validators/trial-feedback";

const KIND_OPTIONS: { value: TrialFeedbackInput["kind"]; label: string }[] = [
  { value: "stuck", label: "卡在某一步 / Stuck on a step" },
  { value: "unclear_copy", label: "文案看不懂 / Unclear wording" },
  { value: "ai_quality", label: "AI 方案是否有用 / AI strategy value" },
  { value: "general", label: "其他 / Other" },
];

const STEP_OPTIONS: { value: NonNullable<TrialFeedbackInput["step"]>; label: string }[] = [
  { value: "login", label: "登录 / Login" },
  { value: "create_project", label: "建项目 / Create project" },
  { value: "upload_document", label: "上传资料 / Upload documents" },
  { value: "document_analysis", label: "资料分析 / Document analysis" },
  { value: "diagnosis", label: "诊断 / Diagnosis" },
  { value: "generate_strategies", label: "生成方案 / Generate strategies" },
  { value: "strategy_review", label: "方案评审 / Strategy review" },
  { value: "reports", label: "报告 / Reports" },
  { value: "other", label: "其他 / Other" },
];

function trialFeedbackEnabled() {
  return process.env.NEXT_PUBLIC_TRIAL_FEEDBACK !== "false";
}

export function TrialFeedbackWidget() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<TrialFeedbackInput["kind"]>("general");
  const [step, setStep] = useState<TrialFeedbackInput["step"]>("other");
  const [notes, setNotes] = useState("");
  const [confusingText, setConfusingText] = useState("");
  const [aiValueRating, setAiValueRating] = useState("");
  const [isBlocker, setIsBlocker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  if (!trialFeedbackEnabled()) return null;
  if (status !== "authenticated" || !session?.user) return null;

  const projectMatch = pathname.match(/^\/projects\/([^/]+)/);
  const projectId = projectMatch?.[1];

  const resetForm = () => {
    setKind("general");
    setStep("other");
    setNotes("");
    setConfusingText("");
    setAiValueRating("");
    setIsBlocker(false);
    setError("");
    setDone(false);
  };

  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim() || submitting) return;

    setSubmitting(true);
    setError("");

    const body: TrialFeedbackInput = {
      kind,
      step,
      notes: notes.trim(),
      pagePath: pathname,
      projectId: projectId && projectId !== "new" ? projectId : undefined,
      isBlocker,
    };

    if (kind === "unclear_copy" && confusingText.trim()) {
      body.confusingText = confusingText.trim();
    }
    if (kind === "ai_quality" && aiValueRating) {
      body.aiValueRating = Number(aiValueRating);
    }

    const res = await fetch("/api/trial-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "提交失败，请稍后再试");
      return;
    }

    setDone(true);
    setTimeout(handleClose, 1800);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-border/80 bg-card/95 px-4 py-2.5 text-xs font-medium shadow-lg backdrop-blur hover:bg-muted/80 transition-colors"
        title="试用反馈 · Trial feedback"
      >
        <MessageCirclePlus className="h-4 w-4 text-primary" />
        <span className="hidden sm:inline">试用反馈</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
          <div className="relative z-10 w-full max-w-md rounded-lg border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <h3 className="text-sm font-medium">试用反馈</h3>
                <p className="text-[10px] text-muted-foreground">Pilot feedback — 帮助我们改进</p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClose}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            {done ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                感谢反馈！我们会尽快处理。
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-4 space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">反馈类型</Label>
                  <Select
                    value={kind}
                    onChange={(e) => setKind(e.target.value as TrialFeedbackInput["kind"])}
                    className="h-8 text-xs w-full"
                  >
                    {KIND_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">相关步骤（可选）</Label>
                  <Select
                    value={step}
                    onChange={(e) =>
                      setStep(e.target.value as NonNullable<TrialFeedbackInput["step"]>)
                    }
                    className="h-8 text-xs w-full"
                  >
                    {STEP_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </div>

                {kind === "unclear_copy" && (
                  <div className="space-y-1">
                    <Label className="text-xs">哪句话看不懂？</Label>
                    <Textarea
                      value={confusingText}
                      onChange={(e) => setConfusingText(e.target.value)}
                      className="text-xs min-h-[56px]"
                      placeholder="请粘贴或描述界面上的文案"
                    />
                  </div>
                )}

                {kind === "ai_quality" && (
                  <div className="space-y-1">
                    <Label className="text-xs">AI 方案参考价值（1–5）</Label>
                    <Select
                      value={aiValueRating}
                      onChange={(e) => setAiValueRating(e.target.value)}
                      className="h-8 text-xs w-full"
                    >
                      <option value="">请选择</option>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={String(n)}>
                          {n} {n === 1 ? "— 几乎没用" : n === 5 ? "— 很有参考价值" : ""}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-xs">具体说明 *</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    required
                    className="text-xs min-h-[88px]"
                    placeholder="发生了什么？你希望产品怎样表现？"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={isBlocker}
                    onChange={(e) => setIsBlocker(e.target.checked)}
                    className="rounded border-border"
                  />
                  这一步完全用不下去（阻塞性问题）
                </label>

                {error && <p className="text-[10px] text-destructive">{error}</p>}

                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
                    取消
                  </Button>
                  <Button type="submit" variant="copper" size="sm" disabled={submitting}>
                    {submitting ? "提交中..." : "提交反馈"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
