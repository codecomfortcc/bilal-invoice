import { create } from "zustand";

interface UiState {
  isDebugMode: boolean;
  developerMode: boolean;
  zoom: number;
  toggleDebugMode: () => void;
  setDeveloperMode: (mode: boolean) => void;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  systemFonts: { family: string, variants: string[] }[];
  loadSystemFonts: () => Promise<void>;
  loadPreferences: () => Promise<void>;
}

export const useUiStore = create<UiState>((set) => ({
  isDebugMode: false,
  developerMode: false,
  zoom: 100,
  systemFonts: [],
  loadSystemFonts: async () => {
    try {
      const { getSystemFonts } = await import("@/services/system.service");
      const fonts = await getSystemFonts();
      set({ systemFonts: fonts });
    } catch (e) {
      console.error("Failed to load system fonts:", e);
    }
  },
  loadPreferences: async () => {
    try {
      const { getPreference } = await import("@/services/system.service");
      const devMode = await getPreference("developer_mode");
      if (devMode === "true") {
        set({ developerMode: true });
      }
    } catch (e) {}
  },
  toggleDebugMode: () => set((s) => ({ isDebugMode: !s.isDebugMode })),
  setDeveloperMode: (developerMode) => {
    set({ developerMode });
    import("@/services/system.service").then(({ setPreference }) => {
      setPreference("developer_mode", String(developerMode));
    });
  },
  setZoom: (zoom) => set({ zoom }),
  zoomIn: () => set((s) => ({ zoom: Math.min(s.zoom + 10, 200) })),
  zoomOut: () => set((s) => ({ zoom: Math.max(s.zoom - 10, 30) })),
}));
