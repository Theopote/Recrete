import { AppShell } from "@/components/app/AppShell";
import { TopBar } from "@/components/app/TopBar";
import { SectionHeader } from "@/components/app/SectionHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { AccountSettingsCard } from "@/components/settings/AccountSettingsCard";
import { TrialFeedbackPanel } from "@/components/trial/TrialFeedbackPanel";

export default function SettingsPage() {
  const aiService = process.env.AI_SERVICE ?? "mock";
  const hasOpenAI = !!process.env.OPENAI_API_KEY;

  return (
    <AppShell>
      <TopBar title="Settings" subtitle="Platform configuration" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <SectionHeader
            title="Settings"
            description="Configure AI services, organization preferences, and platform options"
          />

          <Card>
            <CardContent className="p-5 space-y-4">
              <h3 className="text-sm font-medium">AI Service</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Active Provider</p>
                  <Badge variant="outline" className="mt-1 capitalize">{aiService}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">OpenAI API Key</p>
                  <Badge variant="outline" className="mt-1">{hasOpenAI ? "Configured" : "Not set"}</Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Set <code className="text-[10px] bg-muted px-1 rounded">AI_SERVICE=openai</code> and{" "}
                <code className="text-[10px] bg-muted px-1 rounded">OPENAI_API_KEY</code> in{" "}
                <code className="text-[10px] bg-muted px-1 rounded">.env</code> to enable live AI responses.
              </p>
            </CardContent>
          </Card>

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
