import { create } from "zustand";

interface UiState {
  isDebugMode: boolean;
  zoom: number;
  toggleDebugMode: () => void;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  isDebugMode: false,
  zoom: 0.8,
  toggleDebugMode: () => set((s) => ({ isDebugMode: !s.isDebugMode })),
  setZoom: (zoom) => set({ zoom }),
  zoomIn: () => set((s) => ({ zoom: Math.min(s.zoom + 0.1, 2) })),
  zoomOut: () => set((s) => ({ zoom: Math.max(s.zoom - 0.1, 0.3) })),
}));
