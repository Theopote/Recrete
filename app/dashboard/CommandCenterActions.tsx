"use client";

import { useRouter } from "next/navigation";
import { AICommandInput } from "@/components/ai/AICommandInput";
import { CREATE_PROJECT_SUGGESTIONS } from "@/lib/ai/prompts";
import { RoleGate } from "@/components/auth/RoleGate";

export function CommandCenterActions() {
  const router = useRouter();

  return (
    <RoleGate
      action="edit_profile"
      fallback={
        <p className="text-xs text-muted-foreground rounded-md border border-dashed p-4">
          Your role does not include project creation. Contact a project manager for access.
        </p>
      }
    >
      <AICommandInput
        placeholder="Describe a building and renovation goal in one sentence — AI will create your project, Building Memory, and next steps."
        suggestions={CREATE_PROJECT_SUGGESTIONS}
        submitLabel="Create with AI"
        onSubmit={(value) => {
          router.push(`/projects/new?brief=${encodeURIComponent(value)}`);
        }}
      />
    </RoleGate>
  );
}
