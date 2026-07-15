"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AIErrorBannerProps {
  message: string;
  retryable?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function AIErrorBanner({
  message,
  retryable,
  onRetry,
  onDismiss,
}: AIErrorBannerProps) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <div className="flex-1 space-y-1">
        <p>{message}</p>
        {(retryable && onRetry) || onDismiss ? (
          <div className="flex gap-2">
            {retryable && onRetry && (
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-[10px]"
                onClick={onRetry}
              >
                <RefreshCw className="mr-1 h-3 w-3" />
                重试
              </Button>
            )}
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px]"
                onClick={onDismiss}
              >
                关闭
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
