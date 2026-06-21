"use client";

import { useRouter } from "next/navigation";
import { AICommandInput } from "@/components/ai/AICommandInput";
import { ASSISTANT_SUGGESTIONS } from "@/lib/ai";

export function CommandCenterActions() {
  const router = useRouter();

  return (
    <AICommandInput
      suggestions={ASSISTANT_SUGGESTIONS}
      onSubmit={(value) => {
        const demoId = "proj-demo";
        router.push(`/projects/${demoId}?section=overview&prompt=${encodeURIComponent(value)}`);
      }}
    />
  );
}
