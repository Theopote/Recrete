"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ASSISTANT_SUGGESTIONS } from "@/lib/ai/prompts";
import { cn } from "@/lib/utils";
import type { AIMessage } from "@/types";
import type { KnowledgeSnippet, SourceEvidence } from "@/types/ai";
import { Bot, Send, Sparkles, User, X } from "lucide-react";

interface AIAssistantPanelProps {
  projectId: string;
  projectName: string;
  onClose?: () => void;
}

interface CopilotSources {
  knowledge: KnowledgeSnippet[];
  evidence: SourceEvidence[];
}

type ChatMessage = AIMessage & { sources?: CopilotSources };

const SOURCE_LABELS: Record<KnowledgeSnippet["sourceType"], string> = {
  case: "案例",
  knowledge: "知识",
  code: "规范",
  project_doc: "文档",
};

export function AIAssistantPanel({ projectId, projectName, onClose }: AIAssistantPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `Hello! I'm your Recrete AI assistant for **${projectName}**. I can help with risks, missing information, strategy recommendations, and project planning. What would you like to know?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: AIMessage = { role: "user", content, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
          sources: data.sources as CopilotSources | undefined,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <aside className="flex h-full w-80 flex-col border-l bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-copper/10 p-1.5">
            <Sparkles className="h-4 w-4 text-copper" />
          </div>
          <div>
            <p className="text-xs font-semibold">AI Copilot</p>
            <p className="text-[10px] text-muted-foreground">Building Memory + RAG</p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn("flex gap-2", msg.role === "user" ? "flex-row-reverse" : "")}
          >
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                msg.role === "assistant" ? "bg-copper/10" : "bg-primary"
              )}
            >
              {msg.role === "assistant" ? (
                <Bot className="h-3 w-3 text-copper" />
              ) : (
                <User className="h-3 w-3 text-primary-foreground" />
              )}
            </div>
            <div
              className={cn(
                "rounded-lg px-3 py-2 text-xs leading-relaxed max-w-[85%]",
                msg.role === "assistant"
                  ? "bg-muted text-foreground"
                  : "bg-primary text-primary-foreground"
              )}
            >
              <div className="whitespace-pre-wrap">{msg.content.replace(/\*\*(.*?)\*\*/g, "$1")}</div>
              {msg.role === "assistant" && msg.sources && (msg.sources.knowledge.length > 0 || msg.sources.evidence.length > 0) && (
                <div className="mt-2 border-t border-border/60 pt-2 space-y-1">
                  <p className="text-[10px] font-medium text-muted-foreground">RAG 引用</p>
                  <div className="flex flex-wrap gap-1">
                    {msg.sources.knowledge.slice(0, 4).map((k) => (
                      <span
                        key={`${k.sourceType}-${k.id}`}
                        className="rounded bg-background/80 px-1.5 py-0.5 text-[9px] text-muted-foreground"
                        title={k.excerpt}
                      >
                        [{SOURCE_LABELS[k.sourceType]}] {k.title.length > 18 ? `${k.title.slice(0, 18)}…` : k.title}
                      </span>
                    ))}
                    {msg.sources.evidence.slice(0, 2).map((e, idx) => (
                      <span
                        key={e.id ?? idx}
                        className="rounded bg-background/80 px-1.5 py-0.5 text-[9px] text-muted-foreground"
                        title={e.quote ?? undefined}
                      >
                        [证据] {e.locationLabel ?? e.sourceType}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-copper/10">
              <Bot className="h-3 w-3 text-copper animate-pulse" />
            </div>
            <div className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
              Analyzing project data...
            </div>
          </div>
        )}
      </div>

      <div className="border-t p-3 space-y-2">
        <div className="flex flex-wrap gap-1">
          {ASSISTANT_SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground hover:border-copper/40 hover:text-foreground transition-colors"
            >
              {s.length > 28 ? s.slice(0, 28) + "…" : s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this project..."
            className="min-h-[36px] max-h-24 text-xs resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
          />
          <Button
            variant="copper"
            size="icon"
            className="shrink-0 h-9 w-9"
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
