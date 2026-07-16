"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/lib/i18n/use-locale";
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
  const { t } = useLocale();
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
        <Wand2 className="h-3 w-3 mr-1" /> {t("Refine", "迭代优化")}
      </Button>
    );
  }

  return (
    <div className="w-full mt-2 p-3 rounded-md border bg-muted/40 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium">
          {t("Refine", "迭代优化")}: {strategy.name}
        </p>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setOpen(false)}>
          <X className="h-3 w-3" />
        </Button>
      </div>
      <Textarea
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        placeholder={t(
          "e.g. Make the facade more ambitious and add rooftop program",
          "例如：立面改造更进取，并增加屋顶活动空间"
        )}
        className="text-xs min-h-[64px]"
      />
      <Button variant="copper" size="sm" onClick={handleRefine} disabled={loading || !instruction.trim()}>
        {loading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null}
        {t("Apply iteration", "应用迭代")}
      </Button>
    </div>
  );
}
