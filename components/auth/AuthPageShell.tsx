"use client";

import { LanguageToggle } from "@/components/app/LanguageToggle";

export function AuthPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <div className="absolute top-4 right-4 z-10">
        <LanguageToggle />
      </div>
      {children}
    </div>
  );
}
