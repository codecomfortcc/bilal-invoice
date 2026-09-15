import { toast } from "sonner";
import {
  getShortcutBindings,
  saveShortcutBinding,
  resetShortcutBinding,
} from "@/services/system.service";
import { useHistoryStore } from "@/stores/history.store";
import { invoke } from "@tauri-apps/api/core";

export interface ShortcutItem {
  id: string;
  title: string;
  description: string;
  category: "Search & Palette" | "Navigation" | "Invoice Actions" | "File" | "History & Editing" | "System & Dev" | string;
  keys: string[]; // Display labels, e.g. ["Ctrl", "P"]
  key: string; // Target event.key, e.g. "p"
  ctrlKey?: boolean; // Matches Ctrl or Cmd
  shiftKey?: boolean;
  altKey?: boolean;
  allowInInputs?: boolean;
  isCustomized?: boolean;
  defaultKeys?: string[];
  defaultKeyChar?: string;
  defaultModifiers?: { ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean };
  action?: (ctx: ShortcutHandlerContext) => void | Promise<void>;
}

export interface ShortcutHandlerContext {
  navigate: (path: string) => void;
  uiStore: {
    showGlobalSearch: boolean;
    setShowGlobalSearch: (show: boolean) => void;
    openGlobalSearch?: (mode?: "plain" | "items" | "history" | "settings") => void;
    showImportModal?: boolean;
    setShowImportModal?: (show: boolean) => void;
    showExportModal?: boolean;
    setShowExportModal?: (show: boolean) => void;
    developerMode: boolean;
    setDeveloperMode: (mode: boolean) => void;
  };
  invoiceStore?: {
    createNewInvoice: () => Promise<void>;
  };
}

// Complete static registry of all shortcuts across the application
export const ALL_SHORTCUTS_REGISTRY: ShortcutItem[] = [
  // SEARCH & PALETTE
  {
    id: "shortcut-search-ctrl-shift-p",
    title: "Open Command Palette (> Settings)",
    description: "Launch command palette directly in > Settings mode",
    category: "Search & Palette",
    keys: ["Ctrl", "Shift", "P"],
    key: "p",
    ctrlKey: true,
    shiftKey: true,
    action: (ctx) => {
      if (ctx.uiStore.openGlobalSearch) {
        ctx.uiStore.openGlobalSearch("settings");
      } else {
        ctx.uiStore.setShowGlobalSearch(true);
      }
    },
  },
  {
    id: "shortcut-search-ctrl-p",
    title: "Open Command Palette / Search",
    description: "Launch global search modal to search items, history, and settings",
    category: "Search & Palette",
    keys: ["Ctrl", "P"],
    key: "p",
    ctrlKey: true,
    action: (ctx) => {
      ctx.uiStore.setShowGlobalSearch(!ctx.uiStore.showGlobalSearch);
    },
  },
  {
    id: "shortcut-search-ctrl-k",
    title: "Open Command Palette / Search (Alt)",
    description: "Alternative quick shortcut for command palette",
    category: "Search & Palette",
    keys: ["Ctrl", "K"],
    key: "k",
    ctrlKey: true,
    action: (ctx) => {
      ctx.uiStore.setShowGlobalSearch(!ctx.uiStore.showGlobalSearch);
    },
  },
  {
    id: "shortcut-toggle-quick-style",
    title: "Toggle Quick Style Editor",
    description: "Open or close the floating global style font & color editor",
    category: "Search & Palette",
    keys: ["Ctrl", "T"],
    key: "t",
    ctrlKey: true,
  },
  {
    id: "shortcut-close-quick-style",
    title: "Close Quick Style Editor",
    description: "Close the floating quick style editor when open",
    category: "Search & Palette",
    keys: ["Escape"],
    key: "Escape",
  },

  // NAVIGATION
  {
    id: "shortcut-open-settings",
    title: "Open Preferences & Settings",
    description: "Navigate directly to Application Settings page",
    category: "Navigation",
    keys: ["Ctrl", ","],
    key: ",",
    ctrlKey: true,
    action: (ctx) => {
      ctx.navigate("/settings");
    },
  },
  {
    id: "shortcut-open-shortcuts",
    title: "View All Keyboard Shortcuts",
    description: "Open keyboard shortcuts overview cheat sheet",
    category: "Navigation",
    keys: ["Ctrl", "/"],
    key: "/",
    ctrlKey: true,
    action: (ctx) => {
      ctx.navigate("/shortcuts");
    },
  },
  {
    id: "shortcut-nav-editor",
    title: "Go to Invoice Editor",
    description: "Switch active view to primary Invoice Editor",
    category: "Navigation",
    keys: ["Ctrl", "Shift", "E"],
    key: "e",
    ctrlKey: true,
    shiftKey: true,
    action: (ctx) => {
      ctx.navigate("/");
    },
  },
  {
    id: "shortcut-nav-inventory",
    title: "Go to Inventory Items",
    description: "Switch active view to Products & Services Inventory",
    category: "Navigation",
    keys: ["Ctrl", "Shift", "I"],
    key: "i",
    ctrlKey: true,
    shiftKey: true,
    action: (ctx) => {
      ctx.navigate("/items");
    },
  },
  {
    id: "shortcut-nav-history",
    title: "Go to Invoice History",
    description: "Switch active view to past invoice records",
    category: "Navigation",
    keys: ["Ctrl", "Shift", "H"],
    key: "h",
    ctrlKey: true,
    shiftKey: true,
    action: (ctx) => {
      ctx.navigate("/history");
    },
  },
  {
    id: "shortcut-toggle-sidebar",
    title: "Toggle Main Sidebar",
    description: "Collapse or expand the primary application sidebar",
    category: "Navigation",
    keys: ["Ctrl", "B"],
    key: "b",
    ctrlKey: true,
  },
  {
    id: "shortcut-zoom-in",
    title: "Zoom In Invoice Editor",
    description: "Increase the visual size of the invoice editor",
    category: "Navigation",
    keys: ["Ctrl", "+"],
    key: "+",
    ctrlKey: true,
    allowInInputs: true,
  },
  {
    id: "shortcut-zoom-out",
    title: "Zoom Out Invoice Editor",
    description: "Decrease the visual size of the invoice editor",
    category: "Navigation",
    keys: ["Ctrl", "-"],
    key: "-",
    ctrlKey: true,
    allowInInputs: true,
  },

  // INVOICE ACTIONS
  {
    id: "shortcut-new-invoice",
    title: "Create New Invoice Draft",
    description: "Clear current workspace and prepare a fresh invoice draft",
    category: "Invoice Actions",
    keys: ["Ctrl", "N"],
    key: "n",
    ctrlKey: true,
    action: async (ctx) => {
      if (ctx.invoiceStore) {
        await ctx.invoiceStore.createNewInvoice();
        ctx.navigate("/");
        toast.success("Created new invoice draft");
      }
    },
  },
  {
    id: "shortcut-open-invoice-details",
    title: "Open Invoice Details & Currency Modal",
    description: "Open dialog to edit invoice meta, currency, dates, and PO numbers",
    category: "Invoice Actions",
    keys: ["Ctrl", "D"],
    key: "d",
    ctrlKey: true,
  },
  {
    id: "shortcut-save-pdf",
    title: "Save & Export PDF Document",
    description: "Generate and save the invoice as a PDF file",
    category: "Invoice Actions",
    keys: ["Ctrl", "S"],
    key: "s",
    ctrlKey: true,
    allowInInputs: true,
  },
  {
    id: "shortcut-generate-pdf-enter",
    title: "Generate PDF (Enter)",
    description: "Alternative shortcut to generate and save invoice as PDF",
    category: "Invoice Actions",
    keys: ["Ctrl", "Enter"],
    key: "Enter",
    ctrlKey: true,
    allowInInputs: true,
  },
  {
    id: "shortcut-queue-snapshot",
    title: "Queue Snapshot to Export List",
    description: "Add a snapshot of the current invoice to the export queue",
    category: "Invoice Actions",
    keys: ["Ctrl", "Q"],
    key: "q",
    ctrlKey: true,
  },

  // FILE IMPORT & EXPORT
  {
    id: "shortcut-import-modal",
    title: "Open Import Modal & History",
    description: "Open centered modal for drag & drop file import and previous import history",
    category: "File",
    keys: ["Ctrl", "I"],
    key: "i",
    ctrlKey: true,
    action: (ctx) => {
      ctx.uiStore.setShowImportModal?.(!ctx.uiStore.showImportModal);
    },
  },
  {
    id: "shortcut-export-modal",
    title: "Open Export Options Modal",
    description: "Open centered modal to select fields and export invoice to JSON",
    category: "File",
    keys: ["Ctrl", "E"],
    key: "e",
    ctrlKey: true,
    action: (ctx) => {
      ctx.uiStore.setShowExportModal?.(!ctx.uiStore.showExportModal);
    },
  },
  {
    id: "shortcut-import-json",
    title: "Direct Import File",
    description: "Directly open file dialog to import an invoice JSON project",
    category: "File",
    keys: ["Ctrl", "Alt", "I"],
    key: "i",
    ctrlKey: true,
    altKey: true,
    action: async () => {
      const { importProjectData } = await import("@/services/importExport.service");
      await importProjectData();
    },
  },
  {
    id: "shortcut-export-json",
    title: "Direct Export File",
    description: "Directly export current invoice project to JSON file",
    category: "File",
    keys: ["Ctrl", "Alt", "E"],
    key: "e",
    ctrlKey: true,
    altKey: true,
    action: async () => {
      const { exportProjectData } = await import("@/services/importExport.service");
      await exportProjectData();
    },
  },

  // HISTORY & EDITING
  {
    id: "shortcut-undo",
    title: "Undo Editor State",
    description: "Revert previous invoice field edit or company change",
    category: "History & Editing",
    keys: ["Ctrl", "Z"],
    key: "z",
    ctrlKey: true,
    action: () => {
      useHistoryStore.getState().undo();
      toast.info("Undo");
    },
  },
  {
    id: "shortcut-redo",
    title: "Redo Editor State",
    description: "Reapply previously undone invoice change",
    category: "History & Editing",
    keys: ["Ctrl", "Shift", "Z"],
    key: "z",
    ctrlKey: true,
    shiftKey: true,
    action: () => {
      useHistoryStore.getState().redo();
      toast.info("Redo");
    },
  },

  // SYSTEM & DEV
  {
    id: "shortcut-toggle-devmode",
    title: "Toggle Developer Mode",
    description: "Toggle developer mode for element inspection and logs",
    category: "System & Dev",
    keys: ["Ctrl", "Alt", "D"],
    key: "d",
    ctrlKey: true,
    altKey: true,
    action: (ctx) => {
      const nextMode = !ctx.uiStore.developerMode;
      ctx.uiStore.setDeveloperMode(nextMode);
      toast.success(`Developer Mode ${nextMode ? "Enabled" : "Disabled"}`);
    },
  },
  {
    id: "shortcut-open-devtools",
    title: "Open Native DevTools Window",
    description: "Launch native browser DevTools (Requires Developer Mode ON)",
    category: "System & Dev",
    keys: ["F12"],
    key: "f12",
    action: async (ctx) => {
      if (!ctx.uiStore.developerMode) {
        toast.error("Developer Mode is disabled. Enable Developer Mode first.");
        return;
      }
      try {
        await invoke("open_devtools");
        toast.success("DevTools opened");
      } catch (e) {
        toast.error("Failed to open DevTools");
      }
    },
  },
];

/**
 * Dynamically register a shortcut into the registry.
 */
export function addRegistryShortcut(shortcut: ShortcutItem): void {
  const existingIdx = ALL_SHORTCUTS_REGISTRY.findIndex((s) => s.id === shortcut.id);
  if (existingIdx >= 0) {
    const existing = ALL_SHORTCUTS_REGISTRY[existingIdx];
    ALL_SHORTCUTS_REGISTRY[existingIdx] = {
      ...shortcut,
      action: shortcut.action || existing.action,
      key: existing.isCustomized ? existing.key : existing.key || shortcut.key,
      keys: existing.isCustomized ? existing.keys : existing.keys || shortcut.keys,
      ctrlKey: existing.isCustomized ? existing.ctrlKey : existing.ctrlKey ?? shortcut.ctrlKey,
      shiftKey: existing.isCustomized ? existing.shiftKey : existing.shiftKey ?? shortcut.shiftKey,
      altKey: existing.isCustomized ? existing.altKey : existing.altKey ?? shortcut.altKey,
      isCustomized: existing.isCustomized,
      defaultKeys: existing.defaultKeys || shortcut.defaultKeys || [...shortcut.keys],
      defaultKeyChar: existing.defaultKeyChar || shortcut.defaultKeyChar || shortcut.key,
      defaultModifiers: existing.defaultModifiers || shortcut.defaultModifiers || {
        ctrlKey: shortcut.ctrlKey,
        shiftKey: shortcut.shiftKey,
        altKey: shortcut.altKey,
      },
    };
  } else {
    const newShortcut: ShortcutItem = {
      ...shortcut,
      defaultKeys: shortcut.defaultKeys || [...shortcut.keys],
      defaultKeyChar: shortcut.defaultKeyChar || shortcut.key,
      defaultModifiers: shortcut.defaultModifiers || {
        ctrlKey: shortcut.ctrlKey,
        shiftKey: shortcut.shiftKey,
        altKey: shortcut.altKey,
      },
    };
    ALL_SHORTCUTS_REGISTRY.push(newShortcut);
  }
}

/**
 * Save customized shortcut keybindings to Tauri preference SQLite backend.
 */
export async function saveShortcutToBackend(
  id: string,
  keys: string[],
  keyChar: string,
  modifiers: { ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean }
): Promise<void> {
  try {
    await saveShortcutBinding(
      id,
      keys,
      keyChar,
      Boolean(modifiers.ctrlKey),
      Boolean(modifiers.shiftKey),
      Boolean(modifiers.altKey)
    );
  } catch (e) {
    console.error(`Failed to save backend shortcut [${id}]:`, e);
  }
}

/**
 * Reset shortcut to its default keybinding.
 */
export async function resetShortcutToDefault(id: string): Promise<void> {
  const item = ALL_SHORTCUTS_REGISTRY.find((s) => s.id === id);
  if (!item || !item.defaultKeys || !item.defaultKeyChar) return;
  item.keys = [...item.defaultKeys];
  item.key = item.defaultKeyChar;
  item.ctrlKey = item.defaultModifiers?.ctrlKey;
  item.shiftKey = item.defaultModifiers?.shiftKey;
  item.altKey = item.defaultModifiers?.altKey;
  item.isCustomized = false;
  try {
    await resetShortcutBinding(id);
    toast.success(`Reset ${item.title} to default keybinding`);
  } catch (e) {
    console.error(`Failed to reset backend shortcut [${id}]:`, e);
  }
}

/**
 * Load customized shortcut keybindings from Tauri preference SQLite backend.
 */
export async function loadShortcutsFromBackend(): Promise<void> {
  for (const item of ALL_SHORTCUTS_REGISTRY) {
    if (!item.defaultKeys) item.defaultKeys = [...item.keys];
    if (!item.defaultKeyChar) item.defaultKeyChar = item.key;
    if (!item.defaultModifiers) {
      item.defaultModifiers = {
        ctrlKey: item.ctrlKey,
        shiftKey: item.shiftKey,
        altKey: item.altKey,
      };
    }
  }

  try {
    const bindings = await getShortcutBindings();
    for (const b of bindings) {
      const item = ALL_SHORTCUTS_REGISTRY.find((s) => s.id === b.id);
      if (item) {
        item.keys = b.keys;
        item.key = b.key_char;
        item.ctrlKey = b.ctrl_key;
        item.shiftKey = b.shift_key;
        item.altKey = b.alt_key;
        item.isCustomized = true;
      }
    }
  } catch (e) {
    console.error("Failed to load shortcuts from Rust backend SQLite:", e);
  }
}
