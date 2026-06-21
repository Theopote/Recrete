"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface AICommandInputProps {
  placeholder?: string;
  suggestions?: readonly string[];
  onSubmit?: (value: string) => void;
  submitLabel?: string;
  className?: string;
}

export function AICommandInput({
  placeholder = "Describe a renovation project, upload documents, or ask Recrete what to do next.",
  suggestions = [],
  onSubmit,
  submitLabel = "Ask Recrete",
  className,
}: AICommandInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (!value.trim()) return;
    onSubmit?.(value.trim());
    setValue("");
  };

  return (
    <div className={cn("rounded-lg border-2 border-copper/30 bg-card p-4 shadow-sm", className)}>
      <div className="mb-3 flex items-center gap-2">
        <div className="rounded-md bg-copper/10 p-1.5">
          <Sparkles className="h-4 w-4 text-copper" />
        </div>
        <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
          AI Command
        </p>
      </div>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="min-h-[80px] resize-none border-0 bg-muted/40 text-sm focus-visible:ring-copper/30"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {suggestions.slice(0, 3).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setValue(s)}
                className="rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground hover:border-copper/40 hover:text-foreground"
              >
                {s.length > 36 ? s.slice(0, 36) + "…" : s}
              </button>
            ))}
          </div>
        )}
        <Button variant="copper" size="sm" onClick={handleSubmit} disabled={!value.trim()}>
          <Send className="mr-1.5 h-3.5 w-3.5" />
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
