import { AppShell } from "@/components/app/AppShell";
import { TopBar } from "@/components/app/TopBar";
import { SectionHeader } from "@/components/app/SectionHeader";
import { Card, CardContent } from "@/components/ui/card";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { AccountSettingsCard } from "@/components/settings/AccountSettingsCard";
import { AIServiceStatusCard } from "@/components/settings/AIServiceStatusCard";
import { TrialFeedbackPanel } from "@/components/trial/TrialFeedbackPanel";

export default function SettingsPage() {
  return (
    <AppShell>
      <TopBar title="Settings" subtitle="Platform configuration" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <SectionHeader
            title="Settings"
            description="Configure AI services, organization preferences, and platform options"
          />

          <AIServiceStatusCard />

          <Card>
            <CardContent className="p-5 space-y-4">
              <h3 className="text-sm font-medium">Organization</h3>
              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="font-medium">Recrete Studio</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Plan</dt>
                  <dd className="font-medium">Professional (MVP)</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <AccountSettingsCard />

          <TrialFeedbackPanel />

          <SettingsForm />
        </div>
      </main>
    </AppShell>
  );
}
