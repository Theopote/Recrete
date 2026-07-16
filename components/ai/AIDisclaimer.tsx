"use client";

import { AlertTriangle } from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { cn } from "@/lib/utils";

interface AIDisclaimerProps {
  className?: string;
  variant?: "default" | "compact";
}

export function AIDisclaimer({ className, variant = "default" }: AIDisclaimerProps) {
  const { t } = useLocale();

  return (
    <div
      className={cn(
        "rounded-md border border-amber-500/30 bg-amber-500/5 text-xs text-amber-900/90",
        variant === "compact" ? "px-3 py-2" : "px-4 py-3",
        className
      )}
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
        <p>
          {t(
            "AI-generated content is for reference only. Licensed architects and engineers must review before client or regulatory submission.",
            "AI 生成内容仅供参考。对外提交或报审前，须由注册建筑师、工程师等专业人员复核。"
          )}
        </p>
      </div>
    </div>
  );
}
