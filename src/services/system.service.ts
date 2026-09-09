import { invoke } from "@tauri-apps/api/core";

export async function getPreference(key: string): Promise<string | null> {
  return await invoke<string | null>("get_preference", { key });
}

export async function setPreference(key: string, value: string): Promise<void> {
  await invoke("set_preference", { key, value });
}

export async function getSystemFonts(): Promise<{ family: string, variants: string[] }[]> {
  return await invoke<{ family: string, variants: string[] }[]>("get_system_fonts");
}
