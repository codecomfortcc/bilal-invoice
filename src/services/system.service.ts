import { invoke } from "@tauri-apps/api/core";

export interface BackendShortcutBinding {
  id: string;
  keys: string[];
  key_char: string;
  ctrl_key: boolean;
  shift_key: boolean;
  alt_key: boolean;
}

export async function getPreference(key: string): Promise<string | null> {
  return await invoke<string | null>("get_preference", { key });
}

export async function setPreference(key: string, value: string): Promise<void> {
  await invoke("set_preference", { key, value });
}

export async function getShortcutBindings(): Promise<BackendShortcutBinding[]> {
  return await invoke<BackendShortcutBinding[]>("get_shortcut_bindings");
}

export async function saveShortcutBinding(
  id: string,
  keys: string[],
  keyChar: string,
  ctrlKey: boolean,
  shiftKey: boolean,
  altKey: boolean
): Promise<void> {
  await invoke("save_shortcut_binding", {
    id,
    keys,
    keyChar,
    ctrlKey,
    shiftKey,
    altKey,
  });
}

export async function resetShortcutBinding(id: string): Promise<void> {
  await invoke("reset_shortcut_binding", { id });
}

export async function getSystemFonts(): Promise<{ family: string, variants: string[] }[]> {
  return await invoke<{ family: string, variants: string[] }[]>("get_system_fonts");
}

