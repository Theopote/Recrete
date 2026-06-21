"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Wand2, Loader2, X } from "lucide-react";
import type { StrategyWithMetrics } from "@/types";

interface StrategyRefineDialogProps {
  projectId: string;
  strategy: StrategyWithMetrics;
  onRefined: (strategy: StrategyWithMetrics) => void;
}

export function StrategyRefineDialog({
  projectId,
  strategy,
  onRefined,
}: StrategyRefineDialogProps) {
  const [open, setOpen] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRefine = async () => {
    if (!instruction.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/strategies/iterate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategyId: strategy.id, instruction: instruction.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        onRefined({
          ...data.strategy,
          createdAt: new Date(data.strategy.createdAt),
          updatedAt: new Date(data.strategy.updatedAt),
        });
        setOpen(false);
        setInstruction("");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => setOpen(true)}>
        <Wand2 className="h-3 w-3 mr-1" /> Refine
      </Button>
    );
  }

  return (
    <div className="w-full mt-2 p-3 rounded-md border bg-muted/40 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium">Refine: {strategy.name}</p>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setOpen(false)}>
          <X className="h-3 w-3" />
        </Button>
      </div>
      <Textarea
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        placeholder="e.g. Make the facade more ambitious and add rooftop program"
        className="text-xs min-h-[64px]"
      />
      <Button variant="copper" size="sm" onClick={handleRefine} disabled={loading || !instruction.trim()}>
        {loading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null}
        Apply iteration
      </Button>
    </div>
  );
}
