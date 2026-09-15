import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUiStore, useInvoiceStore } from "@/stores";
import { ALL_SHORTCUTS_REGISTRY, loadShortcutsFromBackend } from "@/lib/shortcutRegistry";

export function GlobalShortcutsHandler() {
  const navigate = useNavigate();
  const uiStore = useUiStore();
  const invoiceStore = useInvoiceStore();

  useEffect(() => {
    loadShortcutsFromBackend();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (useUiStore.getState().isRecordingShortcut) {
        return;
      }

      const isCtrl = e.ctrlKey || e.metaKey;

      for (const shortcut of ALL_SHORTCUTS_REGISTRY) {
        // Precise modifier matching to prevent shortcut collision
        const matchCtrl = shortcut.ctrlKey ? isCtrl : !isCtrl;
        const matchShift = shortcut.shiftKey ? e.shiftKey : !e.shiftKey;
        const matchAlt = shortcut.altKey ? e.altKey : !e.altKey;
        const matchKey = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (matchCtrl && matchShift && matchAlt && matchKey) {
          const target = e.target as HTMLElement;
          const isInInput =
            target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.isContentEditable;

          // Global palette and navigation shortcuts execute globally
          const isGlobalCommandKey =
            ["p", "k", ",", "/"].includes(shortcut.key.toLowerCase()) && isCtrl;

          if (isInInput && !shortcut.allowInInputs && !isGlobalCommandKey) {
            continue;
          }

          // Only consume event if an action is attached to this shortcut
          if (!shortcut.action) {
            continue;
          }

          // Prevent collision with browser defaults (e.g. Ctrl+Shift+I, Ctrl+P)
          e.preventDefault();
          e.stopPropagation();
          if (e.stopImmediatePropagation) {
            e.stopImmediatePropagation();
          }

          shortcut.action?.({
            navigate,
            uiStore: {
              showGlobalSearch: uiStore.showGlobalSearch,
              setShowGlobalSearch: uiStore.setShowGlobalSearch,
              openGlobalSearch: uiStore.openGlobalSearch,
              showImportModal: uiStore.showImportModal,
              setShowImportModal: uiStore.setShowImportModal,
              showExportModal: uiStore.showExportModal,
              setShowExportModal: uiStore.setShowExportModal,
              developerMode: uiStore.developerMode,
              setDeveloperMode: uiStore.setDeveloperMode,
            },
            invoiceStore: {
              createNewInvoice: invoiceStore.createNewInvoice,
            },
          });
          break;
        }
      }
    };

    // Use capture phase to intercept shortcuts cleanly
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [navigate, uiStore, invoiceStore]);

  return null;
}
