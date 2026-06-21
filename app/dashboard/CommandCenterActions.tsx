"use client";

import { useRouter } from "next/navigation";
import { AICommandInput } from "@/components/ai/AICommandInput";
import { CREATE_PROJECT_SUGGESTIONS } from "@/lib/ai/prompts";

export function CommandCenterActions() {
  const router = useRouter();

  return (
    <AICommandInput
      placeholder="Describe a building and renovation goal in one sentence — AI will create your project, Building Memory, and next steps."
      suggestions={CREATE_PROJECT_SUGGESTIONS}
      submitLabel="Create with AI"
      onSubmit={(value) => {
        router.push(`/projects/new?brief=${encodeURIComponent(value)}`);
      }}
    />
  );
}
