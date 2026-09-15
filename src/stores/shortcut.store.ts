import { create } from "zustand";
import {
  ALL_SHORTCUTS_REGISTRY,
  ShortcutItem,
  loadShortcutsFromBackend,
  saveShortcutToBackend,
  resetShortcutToDefault,
} from "@/lib/shortcutRegistry";

interface ShortcutStoreState {
  shortcuts: ShortcutItem[];
  isLoaded: boolean;
  loadShortcuts: () => Promise<void>;
  updateShortcut: (
    id: string,
    keys: string[],
    keyChar: string,
    modifiers: { ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean }
  ) => Promise<void>;
  resetShortcut: (id: string) => Promise<void>;
}

export const useShortcutStore = create<ShortcutStoreState>((set) => ({
  shortcuts: ALL_SHORTCUTS_REGISTRY,
  isLoaded: false,
  loadShortcuts: async () => {
    await loadShortcutsFromBackend();
    set({ shortcuts: [...ALL_SHORTCUTS_REGISTRY], isLoaded: true });
  },
  updateShortcut: async (id, keys, keyChar, modifiers) => {
    const item = ALL_SHORTCUTS_REGISTRY.find((s) => s.id === id);
    if (item) {
      item.keys = [...keys];
      item.key = keyChar;
      item.ctrlKey = modifiers.ctrlKey;
      item.shiftKey = modifiers.shiftKey;
      item.altKey = modifiers.altKey;
      item.isCustomized = true;
    }
    await saveShortcutToBackend(id, keys, keyChar, modifiers);
    set({ shortcuts: [...ALL_SHORTCUTS_REGISTRY] });
  },
  resetShortcut: async (id) => {
    await resetShortcutToDefault(id);
    set({ shortcuts: [...ALL_SHORTCUTS_REGISTRY] });
  },
}));
