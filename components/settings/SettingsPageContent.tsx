"use client";

import { TopBar } from "@/components/app/TopBar";
import { SectionHeader } from "@/components/app/SectionHeader";
import { Card, CardContent } from "@/components/ui/card";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { AccountSettingsCard } from "@/components/settings/AccountSettingsCard";
import { AIServiceStatusCard } from "@/components/settings/AIServiceStatusCard";
import { OrganizationMembersPanel } from "@/components/settings/OrganizationMembersPanel";
import { ArchivedProjectsPanel } from "@/components/settings/ArchivedProjectsPanel";
import { TrialFeedbackPanel } from "@/components/trial/TrialFeedbackPanel";
import { useLocale } from "@/lib/i18n/use-locale";

export function SettingsPageContent() {
  const { t } = useLocale();

  return (
    <>
      <TopBar
        title="Settings"
        titleZh="设置"
        subtitle="Platform configuration"
        subtitleZh="平台配置"
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <SectionHeader
            title="Settings"
            titleZh="设置"
            description="Configure AI services, organization preferences, and platform options"
            descriptionZh="配置 AI 服务、组织偏好与平台选项"
          />

          <AIServiceStatusCard />

          <OrganizationMembersPanel />

          <ArchivedProjectsPanel />

          <Card>
            <CardContent className="p-5 space-y-4">
              <h3 className="text-sm font-medium">{t("Organization", "组织信息")}</h3>
              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-muted-foreground">{t("Name", "名称")}</dt>
                  <dd className="font-medium">Recrete Studio</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("Plan", "套餐")}</dt>
                  <dd className="font-medium">{t("Professional (MVP)", "专业版 (MVP)")}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <AccountSettingsCard />
          <TrialFeedbackPanel />
          <SettingsForm />
        </div>
      </main>
    </>
  );
}
