import { create } from "zustand";

interface UiState {
  isDebugMode: boolean;
  developerMode: boolean;
  isEditing: boolean;
  zoom: number;
  lastSeenVersion: string | null;
  showWhatsNew: boolean;
  showGlobalSearch: boolean;
  globalSearchInitialMode: "plain" | "items" | "history" | "settings";
  showImportModal: boolean;
  showExportModal: boolean;
  isRecordingShortcut: boolean;
  toggleDebugMode: () => void;
  setDeveloperMode: (mode: boolean) => void;
  setIsEditing: (isEditing: boolean) => void;
  setLastSeenVersion: (version: string) => void;
  setShowWhatsNew: (show: boolean) => void;
  setShowGlobalSearch: (show: boolean) => void;
  openGlobalSearch: (mode?: "plain" | "items" | "history" | "settings") => void;
  setShowImportModal: (show: boolean) => void;
  setShowExportModal: (show: boolean) => void;
  setIsRecordingShortcut: (recording: boolean) => void;
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
  isEditing: true,
  zoom: 100,
  lastSeenVersion: null,
  showWhatsNew: false,
  showGlobalSearch: false,
  globalSearchInitialMode: "plain",
  showImportModal: false,
  showExportModal: false,
  isRecordingShortcut: false,
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
      
      const lastVersion = await getPreference("last_seen_version");
      if (lastVersion) {
        set({ lastSeenVersion: lastVersion });
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
  setLastSeenVersion: (version) => {
    set({ lastSeenVersion: version });
    import("@/services/system.service").then(({ setPreference }) => {
      setPreference("last_seen_version", version);
    });
  },
  setIsEditing: (isEditing) => set({ isEditing }),
  setShowWhatsNew: (show) => set({ showWhatsNew: show }),
  setShowGlobalSearch: (show) => set({ showGlobalSearch: show }),
  openGlobalSearch: (mode = "plain") =>
    set({ globalSearchInitialMode: mode, showGlobalSearch: true }),
  setShowImportModal: (show) => set({ showImportModal: show }),
  setShowExportModal: (show) => set({ showExportModal: show }),
  setIsRecordingShortcut: (isRecordingShortcut) => set({ isRecordingShortcut }),
  setZoom: (zoom) => set({ zoom }),
  zoomIn: () => set((s) => ({ zoom: Math.min(s.zoom + 10, 200) })),
  zoomOut: () => set((s) => ({ zoom: Math.max(s.zoom - 10, 30) })),
}));
