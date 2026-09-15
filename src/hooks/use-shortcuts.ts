import { useEffect, useRef } from "react";
import { ALL_SHORTCUTS_REGISTRY, addRegistryShortcut, ShortcutItem } from "@/lib/shortcutRegistry";
import { useUiStore } from "@/stores";

type KeyCombo = {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
};

type ShortcutOptions = {
  id?: string;
  title?: string;
  description?: string;
  category?: string;
  preventDefault?: boolean;
  allowInInputs?: boolean;
};

export function useShortcut(
  combo: KeyCombo,
  callback: () => void,
  options: ShortcutOptions = {}
) {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (options.id && options.title) {
      const keys = [];
      if (combo.ctrl) keys.push("Ctrl");
      if (combo.shift) keys.push("Shift");
      if (combo.alt) keys.push("Alt");
      keys.push(combo.key.length === 1 ? combo.key.toUpperCase() : combo.key);

      const shortcutItem: ShortcutItem = {
        id: options.id,
        title: options.title,
        description: options.description || "",
        category: options.category || "General",
        keys,
        key: combo.key,
        ctrlKey: combo.ctrl,
        shiftKey: combo.shift,
        altKey: combo.alt,
        allowInInputs: options.allowInInputs,
        action: () => {
           callbackRef.current();
        }
      };
      
      addRegistryShortcut(shortcutItem);
      
      return () => {
         const item = ALL_SHORTCUTS_REGISTRY.find(s => s.id === options.id);
         if (item) item.action = undefined;
      };
    }
  }, [options.id]); // Run on mount or id change

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (useUiStore.getState().isRecordingShortcut) {
        return;
      }

      let targetCtrl = combo.ctrl;
      let targetShift = combo.shift;
      let targetAlt = combo.alt;
      let targetKey = combo.key;

      if (options.id) {
        const registered = ALL_SHORTCUTS_REGISTRY.find(s => s.id === options.id);
        if (registered) {
          targetCtrl = registered.ctrlKey;
          targetShift = registered.shiftKey;
          targetAlt = registered.altKey;
          targetKey = registered.key;
        }
      }

      const ctrlKey = event.ctrlKey || event.metaKey; 
      if (
        (targetCtrl ? !ctrlKey : ctrlKey) ||
        (targetShift ? !event.shiftKey : event.shiftKey) ||
        (targetAlt ? !event.altKey : event.altKey)
      ) {
        return;
      }

      if (event.key.toLowerCase() !== targetKey.toLowerCase()) {
        if (targetKey === "+" && (event.key === "+" || event.key === "=")) {
          // Allow
        } else {
          return;
        }
      }

      if (!options.allowInInputs) {
        const target = event.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) {
          return;
        }
      }

      if (options.preventDefault !== false) {
        event.preventDefault();
      }

      callbackRef.current();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [combo, options.id, options.allowInInputs, options.preventDefault]);
}
