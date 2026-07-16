import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppLocale } from "@/lib/i18n/locale";

interface UIState {
  aiPanelOpen: boolean;
  sidebarCollapsed: boolean;
  locale: AppLocale;
  setAiPanelOpen: (open: boolean) => void;
  toggleAiPanel: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setLocale: (locale: AppLocale) => void;
  toggleLocale: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      aiPanelOpen: true,
      sidebarCollapsed: false,
      locale: "zh",
      setAiPanelOpen: (open) => set({ aiPanelOpen: open }),
      toggleAiPanel: () => set((s) => ({ aiPanelOpen: !s.aiPanelOpen })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setLocale: (locale) => set({ locale }),
      toggleLocale: () =>
        set((s) => ({ locale: s.locale === "zh" ? "en" : "zh" })),
    }),
    { name: "recrete-ui", skipHydration: true }
  )
);
