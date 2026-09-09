import { invoke } from "@tauri-apps/api/core";
import { InventoryItem } from "../types/inventory";

export async function getInventoryItems(): Promise<InventoryItem[]> {
  try {
    return await invoke<InventoryItem[]>("get_inventory_items");
  } catch (error) {
    console.error("Error fetching inventory items:", error);
    return [];
  }
}

export async function saveInventoryItem(item: InventoryItem): Promise<void> {
  try {
    await invoke("save_inventory_item", { item });
  } catch (error) {
    console.error("Error saving inventory item:", error);
    throw error;
  }
}

export async function deleteInventoryItem(id: string): Promise<void> {
  try {
    await invoke("delete_inventory_item", { id });
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    throw error;
  }
}
