"use client";

import { useRouter } from "next/navigation";
import { AICommandInput } from "@/components/ai/AICommandInput";
import { CREATE_PROJECT_SUGGESTIONS } from "@/lib/ai/prompts";
import { RoleGate } from "@/components/auth/RoleGate";
import { useLocale } from "@/lib/i18n/use-locale";

export function CommandCenterActions() {
  const router = useRouter();
  const { t } = useLocale();

  return (
    <RoleGate
      action="edit_profile"
      fallback={
        <p className="text-xs text-muted-foreground rounded-md border border-dashed p-4">
          {t(
            "Your role does not include project creation. Contact a project manager for access.",
            "当前角色无法创建项目，请联系项目经理开通权限。"
          )}
        </p>
      }
    >
      <AICommandInput
        placeholder={t(
          "Describe a building and renovation goal in one sentence — AI will create your project, Building Memory, and next steps.",
          "用一句话描述建筑与改造目标 — AI 将创建项目、建筑记忆与下一步建议。"
        )}
        suggestions={CREATE_PROJECT_SUGGESTIONS}
        submitLabel={t("Create with AI", "AI 创建项目")}
        onSubmit={(value) => {
          router.push(`/projects/new?brief=${encodeURIComponent(value)}`);
        }}
      />
    </RoleGate>
  );
}
