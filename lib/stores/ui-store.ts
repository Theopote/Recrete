import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  aiPanelOpen: boolean;
  sidebarCollapsed: boolean;
  setAiPanelOpen: (open: boolean) => void;
  toggleAiPanel: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      aiPanelOpen: true,
      sidebarCollapsed: false,
      setAiPanelOpen: (open) => set({ aiPanelOpen: open }),
      toggleAiPanel: () => set((s) => ({ aiPanelOpen: !s.aiPanelOpen })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    }),
    { name: "recrete-ui" }
  )
);
