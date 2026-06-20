"use client";

import { useUIStore } from "@/lib/stores/ui-store";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function SettingsForm() {
  const { aiPanelOpen, setAiPanelOpen } = useUIStore();

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <h3 className="text-sm font-medium">Display Preferences</h3>
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <Label>AI Assistant Panel</Label>
            <p className="text-[10px] text-muted-foreground">Show AI assistant by default on project pages</p>
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
