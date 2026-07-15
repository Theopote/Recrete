import { SidebarNav } from "./SidebarNav";
import { TrialFeedbackWidget } from "@/components/trial/TrialFeedbackWidget";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col overflow-hidden">
        {children}
      </div>
      <TrialFeedbackWidget />
    </div>
  );
}
