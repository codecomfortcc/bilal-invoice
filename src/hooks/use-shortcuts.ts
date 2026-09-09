import { useEffect } from "react";

type KeyCombo = {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
};

type ShortcutOptions = {
  preventDefault?: boolean;
  allowInInputs?: boolean;
};

export function useShortcut(
  combo: KeyCombo,
  callback: () => void,
  options: ShortcutOptions = {}
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check modifiers
      const ctrlKey = event.ctrlKey || event.metaKey; // Treat Meta (Cmd on Mac) as Ctrl
      if (
        (combo.ctrl ? !ctrlKey : ctrlKey) ||
        (combo.shift ? !event.shiftKey : event.shiftKey) ||
        (combo.alt ? !event.altKey : event.altKey)
      ) {
        return;
      }

      // Check key (case insensitive if shift is not explicitly required)
      if (event.key.toLowerCase() !== combo.key.toLowerCase()) {
        // Special handling for symbols like '+' and '=' which can share the same key
        if (combo.key === "+" && (event.key === "+" || event.key === "=")) {
          // Allow it to pass
        } else {
          return;
        }
      }

      // Check if we are typing in an input
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

      callback();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [combo, callback, options]);
}
