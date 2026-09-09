import { create } from 'zustand';
import { InventoryItem } from '../types/inventory';
import { getInventoryItems } from '../services/inventory.service';

interface InventoryState {
  items: InventoryItem[];
  isLoading: boolean;
  fetchItems: () => Promise<void>;
  setItems: (items: InventoryItem[]) => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  items: [],
  isLoading: false,
  fetchItems: async () => {
    set({ isLoading: true });
    try {
      const items = await getInventoryItems();
      set({ items, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch inventory items", error);
      set({ isLoading: false });
    }
  },
  setItems: (items) => set({ items }),
}));
