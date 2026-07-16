"use client";

import { useUIStore } from "@/lib/stores/ui-store";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/use-locale";

export function SettingsForm() {
  const { aiPanelOpen, setAiPanelOpen } = useUIStore();
  const { t } = useLocale();

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <h3 className="text-sm font-medium">{t("Display Preferences", "显示偏好")}</h3>
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <Label>{t("AI Assistant Panel", "AI 助手面板")}</Label>
            <p className="text-[10px] text-muted-foreground">
              {t(
                "Show AI assistant by default on project pages",
                "在项目页默认显示 AI 助手面板"
              )}
            </p>
          </div>
          <input
            type="checkbox"
            checked={aiPanelOpen}
            onChange={(e) => setAiPanelOpen(e.target.checked)}
            className="h-4 w-4 rounded border-input accent-copper"
          />
        </label>
      </CardContent>
    </Card>
  );
}
