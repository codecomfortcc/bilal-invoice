import { create } from "zustand";

interface SessionState {
  visitedInvoiceIds: string[];
  currentIndex: number;
  pushInvoice: (id: string) => void;
  goBack: () => string | null;
  goForward: () => string | null;
  canGoBack: boolean;
  canGoForward: boolean;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  visitedInvoiceIds: [],
  currentIndex: -1,
  canGoBack: false,
  canGoForward: false,

  pushInvoice: (id) => {
    set((state) => {
      // If we're already viewing this invoice, do nothing
      if (
        state.currentIndex >= 0 &&
        state.visitedInvoiceIds[state.currentIndex] === id
      ) {
        return state;
      }

      // If we push a new invoice while somewhere in the middle of the stack,
      // we truncate the forward history.
      const newHistory = state.visitedInvoiceIds.slice(0, state.currentIndex + 1);
      newHistory.push(id);

      return {
        visitedInvoiceIds: newHistory,
        currentIndex: newHistory.length - 1,
        canGoBack: newHistory.length > 1,
        canGoForward: false,
      };
    });
  },

  goBack: () => {
    const state = get();
    if (state.currentIndex > 0) {
      const newIndex = state.currentIndex - 1;
      set({
        currentIndex: newIndex,
        canGoBack: newIndex > 0,
        canGoForward: true,
      });
      return state.visitedInvoiceIds[newIndex];
    }
    return null;
  },

  goForward: () => {
    const state = get();
    if (state.currentIndex < state.visitedInvoiceIds.length - 1) {
      const newIndex = state.currentIndex + 1;
      set({
        currentIndex: newIndex,
        canGoBack: true,
        canGoForward: newIndex < state.visitedInvoiceIds.length - 1,
      });
      return state.visitedInvoiceIds[newIndex];
    }
    return null;
  },
}));
